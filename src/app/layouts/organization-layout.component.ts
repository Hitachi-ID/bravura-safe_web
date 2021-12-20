import {
    Component,
    NgZone,
    OnDestroy,
    OnInit,
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { BroadcasterService } from 'jslib-angular/services/broadcaster.service';

import { UserService } from 'jslib-common/abstractions/user.service';

import { Organization } from 'jslib-common/models/domain/organization';

const BroadcasterSubscriptionId = 'OrganizationLayoutComponent';

@Component({
    selector: 'app-organization-layout',
    templateUrl: 'organization-layout.component.html',
})
export class OrganizationLayoutComponent implements OnInit, OnDestroy {
    organization: Organization;
    businessTokenPromise: Promise<any>;
    private organizationId: string;

    constructor(private route: ActivatedRoute, private userService: UserService,
        private broadcasterService: BroadcasterService, private ngZone: NgZone) { }

    ngOnInit() {
        document.body.classList.remove('layout_frontend');
        this.route.params.subscribe(async params => {
            this.organizationId = params.organizationId;
            await this.load();
        });
        this.broadcasterService.subscribe(BroadcasterSubscriptionId, (message: any) => {
            this.ngZone.run(async () => {
                switch (message.command) {
                    case 'updatedOrgLicense':
                        await this.load();
                        break;
                }
            });
        });
    }

    ngOnDestroy() {
        this.broadcasterService.unsubscribe(BroadcasterSubscriptionId);
    }

    async load() {
        this.organization = await this.userService.getOrganization(this.organizationId);
    }

    get showMenuBar() {
        return this.showManageTab || this.showToolsTab || this.organization.isOwner;
    }

    get showManageTab(): boolean {
        return this.organization.canManageUsers ||
            this.organization.canViewAllCollections ||
            this.organization.canViewAssignedCollections ||
            this.organization.canManageGroups ||
            this.organization.canManagePolicies ||
            this.organization.canAccessEventLogs;
    }

    get showToolsTab(): boolean {
        return this.organization.canAccessImportExport;
    }

    get showReportsTab(): boolean {
        return this.organization.canAccessReports;
    }

    get toolsRoute(): string {
        return 'tools/import';
    }

    get reportsRoute(): string {
        return 'reports/exposed-passwords-report';
    }

    get manageRoute(): string {
        let route: string;
        switch (true) {
            case this.organization.canManageUsers:
                route = 'manage/people';
                break;
            case this.organization.canViewAssignedCollections || this.organization.canViewAllCollections:
                route = 'manage/collections';
                break;
            case this.organization.canManageGroups:
                route = 'manage/groups';
                break;
            case this.organization.canManagePolicies:
                route = 'manage/policies';
                break;
            case this.organization.canAccessEventLogs:
                route = 'manage/events';
                break;
        }
        return route;
    }
}
