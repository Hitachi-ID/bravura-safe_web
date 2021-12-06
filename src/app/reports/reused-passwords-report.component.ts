import {
    Component,
    OnInit,
} from '@angular/core';

import { CipherService } from 'jslib-common/abstractions/cipher.service';
import { MessagingService } from 'jslib-common/abstractions/messaging.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { ModalService } from 'jslib-angular/services/modal.service';

import { CipherView } from 'jslib-common/models/view/cipherView';

import { CipherType } from 'jslib-common/enums/cipherType';

import { CipherReportComponent } from '../tools/cipher-report.component';

@Component({
    selector: 'app-reused-passwords-report',
    templateUrl: 'reused-passwords-report.component.html',
})
export class ReusedPasswordsReportComponent extends CipherReportComponent implements OnInit {
    passwordUseMap: Map<string, number>;

    constructor(protected cipherService: CipherService, modalService: ModalService,
        messagingService: MessagingService, userService: UserService) {
        super(modalService, userService, messagingService, true);
    }

    async ngOnInit() {
        if (await this.checkAccess()) {
            await super.load();
        }
    }

    async setCiphers() {
        const allCiphers = await this.getAllCiphers();
        const ciphersWithPasswords: CipherView[] = [];
        this.passwordUseMap = new Map<string, number>();
        allCiphers.forEach(c => {
            if (c.type !== CipherType.Login || c.login.password == null || c.login.password === '' || c.isDeleted) {
                return;
            }
            ciphersWithPasswords.push(c);
            if (this.passwordUseMap.has(c.login.password)) {
                this.passwordUseMap.set(c.login.password, this.passwordUseMap.get(c.login.password) + 1);
            } else {
                this.passwordUseMap.set(c.login.password, 1);
            }
        });
        const reusedPasswordCiphers = ciphersWithPasswords.filter(c =>
            this.passwordUseMap.has(c.login.password) && this.passwordUseMap.get(c.login.password) > 1);
        this.ciphers = reusedPasswordCiphers;
    }

    protected getAllCiphers(): Promise<CipherView[]> {
        return this.cipherService.getAllDecrypted();
    }

    protected canManageCipher(c: CipherView): boolean {
        // this will only ever be false from an organization view
        return true;
    }
}
