import {
    Component,
    EventEmitter,
    Output,
} from '@angular/core';

import { CollectionService } from 'jslib-common/abstractions/collection.service';
import { FolderService } from 'jslib-common/abstractions/folder.service';
import { StorageService } from 'jslib-common/abstractions/storage.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { GroupingsComponent as BaseGroupingsComponent } from 'jslib-angular/components/groupings.component';

@Component({
    selector: 'app-vault-groupings',
    templateUrl: 'groupings.component.html',
})
export class GroupingsComponent extends BaseGroupingsComponent {
    @Output() onSearchTextChanged = new EventEmitter<string>();

    searchText: string = '';
    searchPlaceholder: string = null;

    public foldersCollapsed: boolean;
    public collectionsCollapsed: boolean;

    constructor(collectionService: CollectionService, folderService: FolderService,
        storageService: StorageService, userService: UserService) {
        super(collectionService, folderService, storageService, userService);
        
        this.collectionsCollapsed = true;
    }

    async ngOnInit() {
        this.foldersCollapsed = await !!this.storageService.get<boolean>('foldersCollapsed');
        this.collectionsCollapsed = await !!this.storageService.get<boolean>('collectionsCollapsed');
    }

    searchTextChanged() {
        this.onSearchTextChanged.emit(this.searchText);
    }

    async foldersCollapse() {
        this.foldersCollapsed = !this.foldersCollapsed;
        await this.storageService.save('foldersCollapsed', this.foldersCollapsed);
    }

    async collectionsCollapse() {
        this.collectionsCollapsed = !this.collectionsCollapsed;
        await this.storageService.save('collectionsCollapsed', this.collectionsCollapsed);
    }
}
