import { Component, ViewChild } from '@angular/core';
import { NavController, Platform, Content, InfiniteScroll, Searchbar} from 'ionic-angular';
import { LookupService, LocalDbLookupService, RemoteLookupService } from '../../app/lookupService';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  lookupService: LookupService;
  items: any[];
  query: string;
  page: number;
  queryCount: number;
  @ViewChild(Content) content: Content;
  @ViewChild(InfiniteScroll) infiniteScroll: InfiniteScroll;
  @ViewChild(Searchbar) searchbar: Searchbar;

  constructor(public navCtrl: NavController, public platform: Platform) {
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

  formatRow(row: any) {
    if (row.direction.indexOf('tu') === 0) {
      return {
        left: row.original,
        right: row.translation
      };
    } else {
      return {
        left: row.translation,
        right: row.original
      };
    }
  }

  box(value, prefix, suffix: string){
    return value? prefix + value + suffix: '';
  }

}
