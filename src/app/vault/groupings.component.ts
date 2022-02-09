import { Component, EventEmitter, Output } from "@angular/core";

import { CollectionService } from "jslib-common/abstractions/collection.service";
import { FolderService } from "jslib-common/abstractions/folder.service";
import { StateService } from "jslib-common/abstractions/state.service";

import { GroupingsComponent as BaseGroupingsComponent } from "jslib-angular/components/groupings.component";

@Component({
  selector: "app-vault-groupings",
  templateUrl: "groupings.component.html",
})
export class GroupingsComponent extends BaseGroupingsComponent {
  @Output() onSearchTextChanged = new EventEmitter<string>();

  searchText: string = "";
  searchPlaceholder: string = null;

  public foldersCollapsed: boolean;
  public collectionsCollapsed: boolean;

  constructor(
    collectionService: CollectionService,
    folderService: FolderService,
    stateService: StateService
  ) {
    super(collectionService, folderService, stateService);
    this.collectionsCollapsed = true;
  }

  async ngOnInit() {
    this.foldersCollapsed = await !!this.stateService.getFoldersCollapsed();
    this.collectionsCollapsed = await !!this.stateService.getCollectionsCollapsed();
  }

  searchTextChanged() {
    this.onSearchTextChanged.emit(this.searchText);
  }

  async foldersCollapse() {
    this.foldersCollapsed = !this.foldersCollapsed;
    await this.stateService.setFoldersCollapsed(this.foldersCollapsed);
  }

  async collectionsCollapse() {
    this.collectionsCollapsed = !this.collectionsCollapsed;
    await this.stateService.setCollectionsCollapsed(this.collectionsCollapsed);
  }
}
