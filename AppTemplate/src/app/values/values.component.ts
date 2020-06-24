import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-values',
    templateUrl: './values.component.html',
    styleUrls: ['./values.component.scss']
})
export class ValuesComponent implements OnInit {

    items = [{ name: "hi" }, { name: "ho" }];

    constructor() { }

    ngOnInit(): void {
    }

}
