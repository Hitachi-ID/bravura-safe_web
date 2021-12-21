import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuditService } from 'jslib-common/abstractions/audit.service';
import { CipherService } from 'jslib-common/abstractions/cipher.service';
import { MessagingService } from 'jslib-common/abstractions/messaging.service';
import { PasswordRepromptService } from 'jslib-common/abstractions/passwordReprompt.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { ModalService } from 'jslib-angular/services/modal.service';

import {
    ExposedPasswordsReportComponent as BaseExposedPasswordsReportComponent,
} from '../../reports/exposed-passwords-report.component';

import { Cipher } from 'jslib-common/models/domain/cipher';
import { CipherView } from 'jslib-common/models/view/cipherView';

@Component({
    selector: 'app-exposed-passwords-report',
    templateUrl: '../../reports/exposed-passwords-report.component.html',
})
export class ExposedPasswordsReportComponent extends BaseExposedPasswordsReportComponent {
    manageableCiphers: Cipher[];

    constructor(cipherService: CipherService, auditService: AuditService,
        modalService: ModalService, messagingService: MessagingService,
        userService: UserService, passwordRepromptService: PasswordRepromptService, private route: ActivatedRoute) {
        super(cipherService, auditService, modalService, messagingService, userService, passwordRepromptService);
    }

    ngOnInit() {
        const dynamicSuper = Object.getPrototypeOf(this.constructor.prototype);
        this.route.parent.parent.params.subscribe(async params => {
            this.organization = await this.userService.getOrganization(params.organizationId);
            this.manageableCiphers = await this.cipherService.getAll();
            // TODO: We should do something about this, calling super in an async function is bad
            dynamicSuper.ngOnInit();
        });
    }

    getAllCiphers(): Promise<CipherView[]> {
        return this.cipherService.getAllFromApiForOrganization(this.organization.id);
    }

    canManageCipher(c: CipherView): boolean {
        return this.manageableCiphers.some(x => x.id === c.id);
    }
}
