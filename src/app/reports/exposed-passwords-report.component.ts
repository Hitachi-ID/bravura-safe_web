import {
    Component,
    OnInit,
} from '@angular/core';

import { AuditService } from 'jslib-common/abstractions/audit.service';
import { CipherService } from 'jslib-common/abstractions/cipher.service';
import { MessagingService } from 'jslib-common/abstractions/messaging.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { ModalService } from 'jslib-angular/services/modal.service';

import { CipherView } from 'jslib-common/models/view/cipherView';

import { CipherType } from 'jslib-common/enums/cipherType';

import { CipherReportComponent } from '../tools/cipher-report.component';

@Component({
    selector: 'app-exposed-passwords-report',
    templateUrl: 'exposed-passwords-report.component.html',
})
export class ExposedPasswordsReportComponent extends CipherReportComponent implements OnInit {
    exposedPasswordMap = new Map<string, number>();

    constructor(protected cipherService: CipherService, protected auditService: AuditService,
        modalService: ModalService, messagingService: MessagingService,
        userService: UserService) {
        super(modalService, userService, messagingService, true);
    }

    ngOnInit() {
        this.checkAccess();
    }

    async load() {
        if (await this.checkAccess()) {
            super.load();
        }
    }

    async setCiphers() {
        const allCiphers = await this.getAllCiphers();
        const exposedPasswordCiphers: CipherView[] = [];
        const promises: Promise<void>[] = [];
        allCiphers.forEach(c => {
            if (c.type !== CipherType.Login || c.login.password == null || c.login.password === '' || c.isDeleted) {
                return;
            }
            const promise = this.auditService.passwordLeaked(c.login.password).then(exposedCount => {
                if (exposedCount > 0) {
                    exposedPasswordCiphers.push(c);
                    this.exposedPasswordMap.set(c.id, exposedCount);
                }
            });
            promises.push(promise);
        });
        await Promise.all(promises);
        this.ciphers = exposedPasswordCiphers;
    }

    protected getAllCiphers(): Promise<CipherView[]> {
        return this.cipherService.getAllDecrypted();
    }

    protected canManageCipher(c: CipherView): boolean {
        // this will only ever be false from the org view;
        return true;
    }
}
