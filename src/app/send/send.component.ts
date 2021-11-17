import {
    Component,
    NgZone,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';

import { SendView } from 'jslib-common/models/view/sendView';

import { SendComponent as BaseSendComponent } from 'jslib-angular/components/send/send.component';

import { AddEditComponent } from './add-edit.component';

import { EnvironmentService } from 'jslib-common/abstractions/environment.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { PolicyService } from 'jslib-common/abstractions/policy.service';
import { SearchService } from 'jslib-common/abstractions/search.service';
import { SendService } from 'jslib-common/abstractions/send.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { BroadcasterService } from 'jslib-angular/services/broadcaster.service';
import { ModalService } from 'jslib-angular/services/modal.service';

const BroadcasterSubscriptionId = 'SendComponent';

@Component({
    selector: 'app-send',
    templateUrl: 'send.component.html',
})
export class SendComponent extends BaseSendComponent {
    @ViewChild('sendAddEdit', { read: ViewContainerRef, static: true }) sendAddEditModalRef: ViewContainerRef;

    constructor(sendService: SendService, i18nService: I18nService,
        platformUtilsService: PlatformUtilsService, environmentService: EnvironmentService,
        ngZone: NgZone, searchService: SearchService, policyService: PolicyService, userService: UserService,
        private modalService: ModalService, private broadcasterService: BroadcasterService) {
        super(sendService, i18nService, platformUtilsService, environmentService, ngZone, searchService,
            policyService, userService);
    }

    async ngOnInit() {
        await super.ngOnInit();
        await this.load();

        // Broadcaster subscription - load if sync completes in the background
        this.broadcasterService.subscribe(BroadcasterSubscriptionId, (message: any) => {
            this.ngZone.run(async () => {
                switch (message.command) {
                    case 'syncCompleted':
                        if (message.successfully) {
                            await this.load();
                        }
                        break;
                }
            });
        });
    }

    ngOnDestroy() {
        this.broadcasterService.unsubscribe(BroadcasterSubscriptionId);
    }

    async addSend() {
        if (this.disableSend) {
            return;
        }

        const component = await this.editSend(null);
        component.type = this.type;
    }

    async editSend(send: SendView) {
        const [modal, childComponent] = await this.modalService.openViewRef(AddEditComponent, this.sendAddEditModalRef, comp => {
            comp.sendId = send == null ? null : send.id;
            comp.onSavedSend.subscribe(async (s: SendView) => {
                modal.close();
                await this.load();
            });
            comp.onDeletedSend.subscribe(async (s: SendView) => {
                modal.close();
                await this.load();
            });
        });

        return childComponent;
    }
}
