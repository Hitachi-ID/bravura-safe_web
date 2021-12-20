import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Organization } from 'jslib-common/models/domain/organization';

import { MessagingService } from 'jslib-common/abstractions/messaging.service';
import { UserService } from 'jslib-common/abstractions/user.service';

@Component({
    selector: 'app-org-reports',
    templateUrl: 'reports.component.html',
})
export class ReportsComponent {
    organization: Organization;
    accessReports = false;
    loading = true;

    constructor(private route: ActivatedRoute, private userService: UserService,
        private messagingService: MessagingService) { }

    ngOnInit() {
        this.route.parent.params.subscribe(async params => {
            this.organization = await this.userService.getOrganization(params.organizationId);
            // TODO: Maybe we want to just make sure they are not on a free plan? Just compare useTotp for now
            // since all paid plans include useTotp
            this.accessReports = this.organization.useTotp;
            this.loading = false;
        });
    }

    upgradeOrganization() {
        this.messagingService.send('upgradeOrganization', { organizationId: this.organization.id });
    }
}
