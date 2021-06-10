import {
    Component,
    ComponentFactoryResolver,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { MessagingService } from 'jslib-common/abstractions/messaging.service';
import { PolicyService } from 'jslib-common/abstractions/policy.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { TwoFactorProviderType } from 'jslib-common/enums/twoFactorProviderType';

import { TwoFactorDuoComponent } from '../../settings/two-factor-duo.component';
import { TwoFactorSetupComponent as BaseTwoFactorSetupComponent } from '../../settings/two-factor-setup.component';

@Component({
    selector: 'app-two-factor-setup',
    templateUrl: '../../settings/two-factor-setup.component.html',
})
export class TwoFactorSetupComponent extends BaseTwoFactorSetupComponent {
    constructor(apiService: ApiService, userService: UserService,
        componentFactoryResolver: ComponentFactoryResolver, messagingService: MessagingService,
        policyService: PolicyService, private route: ActivatedRoute) {
        super(apiService, userService, componentFactoryResolver, messagingService, policyService);
    }

    async ngOnInit() {
        this.route.parent.parent.params.subscribe(async params => {
            this.organizationId = params.organizationId;
            await super.ngOnInit();
        });
    }

    manage(type: TwoFactorProviderType) {
        switch (type) {
            case TwoFactorProviderType.OrganizationDuo:
                const duoComp = this.openModal(this.duoModalRef, TwoFactorDuoComponent);
                duoComp.type = TwoFactorProviderType.OrganizationDuo;
                duoComp.organizationId = this.organizationId;
                duoComp.onUpdated.subscribe((enabled: boolean) => {
                    this.updateStatus(enabled, TwoFactorProviderType.OrganizationDuo);
                });
                break;
            default:
                break;
        }
    }

    protected getTwoFactorProviders() {
        return this.apiService.getTwoFactorOrganizationProviders(this.organizationId);
    }

    protected filterProvider(type: TwoFactorProviderType) {
        return false;
    }
}
