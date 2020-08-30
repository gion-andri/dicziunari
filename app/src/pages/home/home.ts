import { Component, ViewChild } from '@angular/core';
import { NavController, Platform, Content, InfiniteScroll, Searchbar, ModalController} from 'ionic-angular';
import { LookupService, LocalDbLookupService, RemoteLookupService } from '../../app/lookupService';
import { Lemma } from '../../app/models/lemma';
import { ConjugationPage } from '../conjugation/conjugation';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  lookupService: LookupService;
  items: Lemma[];
  query: string;
  page: number;
  queryCount: number;
  @ViewChild(Content) content: Content;
  @ViewChild(InfiniteScroll) infiniteScroll: InfiniteScroll;
  @ViewChild(Searchbar) searchbar: Searchbar;

  constructor(
    public navCtrl: NavController,
    public platform: Platform,
    private modalController: ModalController,
    ) {
    let self = this;
    this.platform.ready().then(() => {
      if (this.platform.is('cordova')) {
        this.lookupService = new LocalDbLookupService;
        // tapping on status bar (ios) should cause the list to be scrolled to top
        window.addEventListener('statusTap', function() {
          self.infiniteScroll.enable(false);
          self.content.scrollToTop();
          self.infiniteScroll.enable(true);
        });
      } else {
        console.log('using remote lookup service');
        this.lookupService = new RemoteLookupService;
      }
      setTimeout(() => self.searchbar.setFocus(), 500);
    });
  }

  getItems(ev: any) {
    // Reset items back to all of the items
    this.items = [];
    this.queryCount = 0;
    let self = this;

    // set val to the value of the searchbar
    let val = ev.target.value;

    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {
      this.query = val.trim();
      this.page = 0;
      console.log('fetch ' + val);
      return this.lookupService.fetch(this.query).then((result) => {
        if (result.count === 0 && !this.query.endsWith('*')) {
          this.query += '*';
          return this.lookupService.fetch(this.query).then((wildcardResult) => {
            self.queryCount = wildcardResult.count;
            self.items = wildcardResult.items.map(row => this.formatRow(row));
          });
        } else {
          console.log('result: ' + result);
          console.log('found '+result.count+' entries')
          console.log('got '+result.items.length+' items');
          self.queryCount = result.count;
          self.items = result.items.map(row => this.formatRow(row));
        }
      });
    }
  }

  doInfinite(infiniteScroll) {
    if (this.items.length >= this.queryCount) {
      infiniteScroll.complete();
      return;
    }
    this.page++;
    var self = this;
    return this.lookupService.fetchMore(this.query, this.page).then((result) => {
      result.forEach((row) => self.items.push(self.formatRow(row)));
      console.log('now we have '+self.items.length+' items');
      infiniteScroll.complete();
    });
  }

  formatRow(row: any): Lemma {
    let lemma: Lemma = {
      DStichwort: row.lemma,
      RStichwort: row.translation,
      infinitiv: row.infinitiv,
      preschentsing1: row.preschentsing1,
      preschentsing2: row.preschentsing2,
      preschentsing3: row.preschentsing3,
      preschentplural1: row.preschentplural1,
      preschentplural2: row.preschentplural2,
      preschentplural3: row.preschentplural3,
      imperfectsing1: row.imperfectsing1,
      imperfectsing2: row.imperfectsing2,
      imperfectsing3: row.imperfectsing3,
      imperfectplural1: row.imperfectplural1,
      imperfectplural2: row.imperfectplural2,
      imperfectplural3: row.imperfectplural3,
      participperfectfs: row.participperfectfs,
      participperfectms: row.participperfectms,
      participperfectfp: row.participperfectfp,
      participperfectmp: row.participperfectmp,
      futursing1: row.futursing1,
      futursing2: row.futursing2,
      futursing3: row.futursing3,
      futurplural1: row.futurplural1,
      futurplural2: row.futurplural2,
      futurplural3: row.futurplural3,
      conjunctivsing1: row.conjunctivsing1,
      conjunctivsing2: row.conjunctivsing2,
      conjunctivsing3: row.conjunctivsing3,
      conjunctivplural1: row.conjunctivplural1,
      conjunctivplural2: row.conjunctivplural2,
      conjunctivplural3: row.conjunctivplural3,
      cundizionalsing1: row.cundizionalsing1,
      cundizionalsing2: row.cundizionalsing2,
      cundizionalsing3: row.cundizionalsing3,
      cundizionalplural1: row.cundizionalplural1,
      cundizionalplural2: row.cundizionalplural2,
      cundizionalplural3: row.cundizionalplural3,
      imperativ1: row.imperativ1,
      imperativ2: row.imperativ2,
      gerundium: row.gerundium,
    };
    if (row.direction.indexOf('de') === 0) {
      return lemma;
    } else {
      lemma.DStichwort = row.translation;
      lemma.RStichwort = row.lemma;
      return lemma;
    }
  }

  box(value, prefix, suffix: string){
    return value? prefix + value + suffix: '';
  }

  showVerb(item: Lemma) {
    const modal = this.modalController.create(ConjugationPage, { lemma: item });
    return modal.present();
  }
}
