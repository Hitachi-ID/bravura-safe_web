import {
    Component,
    OnInit,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { MessagingService } from 'jslib-common/abstractions/messaging.service';
import { UserService } from 'jslib-common/abstractions/user.service';

@Component({
    selector: 'app-tools',
    templateUrl: 'tools.component.html',
})
export class ToolsComponent implements OnInit {
    canAccessPremium = false;

    public toolsFilter: ToolsFilter = {
        'generator': true,
        'import': false,
        'export': false,
    }

    public filters: String[] = ['generator', 'import', 'export'];

    constructor(private userService: UserService, private messagingService: MessagingService, private router: Router, private route: ActivatedRoute) { }

    async ngOnInit() {
        this.canAccessPremium = await this.userService.canAccessPremium();
        const urls: String[] = this.router.url.split('/');
        const url = urls[urls.length - 1];
        if (this.filters.includes(url)) {
            this.filter(url);
        } else {
            this.filter('generator');
        }
    }

    premiumRequired() {
        if (!this.canAccessPremium) {
            this.messagingService.send('premiumRequired');
            return;
        }
    }

    public filter(filterType: String): void {
        for (let prop in this.toolsFilter) {
            if (prop === filterType) {
                this.toolsFilter[prop] = true;
                this.router.navigate([prop], {relativeTo: this.route});
            } else {
                this.toolsFilter[prop] = false;
            }
        }
    }
}

interface ToolsFilter {
    [key: string]: any;
}
