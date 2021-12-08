import {
    Component,
    OnInit,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { MessagingService } from 'jslib-common/abstractions/messaging.service';
import { UserService } from 'jslib-common/abstractions/user.service';

@Component({
    selector: 'app-reports',
    templateUrl: 'reports.component.html',
})
export class ReportsComponent implements OnInit {
    canAccessPremium = false;

    public reportsFilter: ReportsFilter = {
        'exposed-passwords-report': true,
        'reused-passwords-report': false,
        'weak-passwords-report': false,
        'unsecured-websites-report': false,
        'inactive-two-factor-report': false,
    };

    public filters: String[] = ['exposed-passwords-report', 'reused-passwords-report', 'weak-passwords-report', 'unsecured-websites-report', 'inactive-two-factor-report'];

    constructor(private userService: UserService, private messagingService: MessagingService, private router: Router, private route: ActivatedRoute) { }

    async ngOnInit() {
        this.canAccessPremium = await this.userService.canAccessPremium();
        const urls: String[] = this.router.url.split('/');
        const url = urls[urls.length - 1];
        if (this.filters.includes(url)) {
            this.filter(url);
        } else {
            this.filter('exposed-passwords-report');
        }
    }

    premiumRequired() {
        if (!this.canAccessPremium) {
            this.messagingService.send('premiumRequired');
            return;
        }
    }

    public filter(filterType: String): void {
        for (let prop in this.reportsFilter) {
            if (prop === filterType) {
                this.reportsFilter[prop] = true;
                this.router.navigate([prop], {relativeTo: this.route});
            } else {
                this.reportsFilter[prop] = false;
            }
        }
    }
}

interface ReportsFilter {
    [key: string]: any;
}
