import {
    Component,
    NgZone,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { TokenService } from 'jslib-common/abstractions/token.service';

import { BroadcasterService } from 'jslib-angular/services/broadcaster.service';

const BroadcasterSubscriptionId = 'SettingsComponent';

@Component({
    selector: 'app-settings',
    templateUrl: 'settings.component.html',
})
export class SettingsComponent implements OnInit, OnDestroy {
    premium: boolean;
    selfHosted: boolean;

    public settingsFilter: SettingsFilter = {
        'account': true,        
        'options': false,
        'organizations': false,
        'billing': false,
        'domain-rules': false,
        'emergency-access': false,
    }

    public filters: String[] = ['account', 'options', 'organizations', 'billing', 'domain-rules', 'emergency-access'];

    constructor(private tokenService: TokenService, private broadcasterService: BroadcasterService,
        private ngZone: NgZone, private platformUtilsService: PlatformUtilsService, private router: Router, private route: ActivatedRoute) { }

    async ngOnInit() {
        this.broadcasterService.subscribe(BroadcasterSubscriptionId, async (message: any) => {
            this.ngZone.run(async () => {
                switch (message.command) {
                    case 'purchasedPremium':
                        await this.load();
                        break;
                    default:
                }
            });
        });

        this.selfHosted = await this.platformUtilsService.isSelfHost();
        await this.load();
        const urls: String[] = this.router.url.split('/');
        const url = urls[urls.length - 1];
        if (this.filters.includes(url)) {
            this.filter(url);
        } else {
            this.filter('account');
        }
    }

    ngOnDestroy() {
        this.broadcasterService.unsubscribe(BroadcasterSubscriptionId);
    }

    async load() {
        this.premium = await this.tokenService.getPremium();
    }

    public filter(filterType: String):void {
        for (let prop in this.settingsFilter) {
            if (prop === filterType) {
                this.settingsFilter[prop] = true;
                this.router.navigate([prop], {relativeTo: this.route});
            } else {
                this.settingsFilter[prop] = false;
            }
        }
    }
}

interface SettingsFilter {
    [key: string]: any;
}
