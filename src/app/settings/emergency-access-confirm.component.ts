import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
} from '@angular/core';

import { ConstantsService } from 'jslib-common/services/constants.service';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { LogService } from 'jslib-common/abstractions/log.service';
import { StorageService } from 'jslib-common/abstractions/storage.service';

import { Utils } from 'jslib-common/misc/utils';

@Component({
    selector: 'emergency-access-confirm',
    templateUrl: 'emergency-access-confirm.component.html',
})
export class EmergencyAccessConfirmComponent implements OnInit {
    @Input() name: string;
    @Input() userId: string;
    @Input() emergencyAccessId: string;
    @Input() formPromise: Promise<any>;
    @Output() onConfirmed = new EventEmitter();

    dontAskAgain = false;
    loading = true;
    fingerprint: string;

    constructor(private apiService: ApiService, private cryptoService: CryptoService,
        private storageService: StorageService, private logService: LogService) { }

    async ngOnInit() {
        try {
            const publicKeyResponse = await this.apiService.getUserPublicKey(this.userId);
            if (publicKeyResponse != null) {
                const publicKey = Utils.fromB64ToArray(publicKeyResponse.publicKey);
                const fingerprint = await this.cryptoService.getFingerprint(this.userId, publicKey.buffer);
                if (fingerprint != null) {
                    this.fingerprint = fingerprint.join('-');
                }
            }
        } catch (e) {
            this.logService.error(e);
        }
        this.loading = false;
    }

    async submit() {
        if (this.loading) {
            return;
        }

        if (this.dontAskAgain) {
            await this.storageService.save(ConstantsService.autoConfirmFingerprints, true);
        }

        try {
            this.onConfirmed.emit();
        } catch (e) {
            this.logService.error(e);
        }
    }
}
