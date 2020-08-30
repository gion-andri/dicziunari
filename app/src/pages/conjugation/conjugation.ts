import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { Lemma } from '../../app/models/lemma';

@Component({
  selector: 'page-conjugation',
  templateUrl: 'conjugation.html',
})
export class ConjugationPage {

  lemma: Lemma;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    ) {
    this.lemma = navParams.get('lemma');
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ConjugationPage');
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}
