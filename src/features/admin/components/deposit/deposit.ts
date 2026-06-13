import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@shared/services/auth/auth.service';
import { FileNameFormatterService } from '@shared/services/file-name-formatter/file-name-formatter.service';
import { DepositTreeService, TreeNode, DepositSection } from '../../services/deposit-tree.service';

//========== TYPES ==========//

interface FlatRow {
  kind: 'section' | 'node';
  sectionLabel?: string;
  sectionKey?: DepositSection;
  node?: TreeNode;
  guide?: string;
  section?: DepositSection;
  isLeaf?: boolean;
}

interface LotItem {
  baseName: string;
  image: File | null;
  objectUrl: string | null;
  txt: File | null;
  txtFirstLine: string | null;
}

interface SelectedLeaf {
  node: TreeNode;
  section: DepositSection;
  path: string[];
}

interface ElenaLotReport {
  created: number;
  duplicates: number;
  review: { file: string; reason: string }[];
  ignored: number;
}

//========== COMPONENT ==========//

@Component({
  selector: 'app-deposit',
  imports: [],
  templateUrl: './deposit.html',
  styleUrl: './deposit.scss'
})
export class Deposit implements OnDestroy {

  //========== INJECTIONS ==========//

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly formatter = inject(FileNameFormatterService);
  protected readonly treeService = inject(DepositTreeService);

  //========== SIGNALS ==========//

  protected readonly isAdmin = this.auth.isAdmin;

  protected readonly collapsedSections = signal<Set<DepositSection>>(new Set(['marsball', 'bestiaire', 'rover', 'terraformars']));
  protected readonly collapsed = signal<Set<string>>(new Set());
  protected readonly selectedLeaf = signal<SelectedLeaf | null>(null);
  protected readonly lot = signal<LotItem[]>([]);

  protected readonly depotDragOver = signal(false);
  protected readonly treeDragOverLeafId = signal<number | null>(null);

  protected readonly sending = signal(false);
  protected readonly report = signal<ElenaLotReport | null>(null);
  protected readonly sendError = signal(false);

  //========== COMPUTED ==========//

  protected readonly flatTree = computed<FlatRow[]>(() => {
    const result: FlatRow[] = [];
    const collapsedSet = this.collapsed();
    const collapsedSections = this.collapsedSections();
    const sections = this.treeService.sections();

    const marsball = sections.find(s => s.key === 'marsball');
    if (!marsball) return result;

    result.push({ kind: 'section', sectionLabel: marsball.label, sectionKey: marsball.key, guide: '' });

    if (!collapsedSections.has('marsball')) {
      this.flattenNodes(marsball.roots, '', 'marsball', collapsedSet, result);

      for (const sub of sections.filter(s => s.key === 'bestiaire' || s.key === 'rover')) {
        result.push({
          kind: 'section',
          sectionLabel: sub.label,
          sectionKey: sub.key,
          guide: ''
        });
        if (!collapsedSections.has(sub.key)) {
          this.flattenNodes(sub.roots, '   ', sub.key, collapsedSet, result);
        }
      }
    }

    for (const sister of sections.filter(s => s.key === 'terraformars')) {
      result.push({
        kind: 'section',
        sectionLabel: sister.label,
        sectionKey: sister.key,
        guide: ''
      });
      if (!collapsedSections.has(sister.key)) {
        this.flattenNodes(sister.roots, '', sister.key, collapsedSet, result);
      }
    }
    return result;
  });

  protected readonly imageCount = computed(() =>
    this.lot().filter(i => i.image !== null).length
  );

  protected readonly txtCount = computed(() =>
    this.lot().filter(i => i.txt !== null).length
  );

  protected readonly lotEmpty = computed(() => this.lot().length === 0);

  //========== LIFECYCLE ==========//

  ngOnDestroy(): void {
    for (const item of this.lot()) {
      if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
    }
  }

  //========== NAVIGATION ==========//

  protected goAdmin(): void {
    this.router.navigate(['/admin']);
  }

  //========== TREE ==========//

  private flattenNodes(
    nodes: TreeNode[],
    parentGuide: string,
    section: DepositSection,
    collapsedSet: Set<string>,
    out: FlatRow[]
  ): void {
    for (const node of nodes) {
      const isLeaf = node.children.length === 0;
      const guide = isLeaf ? parentGuide + '└─' : parentGuide;
      out.push({ kind: 'node', node, guide, section, isLeaf });
      if (!isLeaf && !collapsedSet.has(this.branchKey(section, node.id))) {
        this.flattenNodes(node.children, parentGuide + '   ', section, collapsedSet, out);
      }
    }
  }

  private branchKey(section: DepositSection, id: number): string {
    return `${section}:${id}`;
  }

  private collectBranchKeys(nodes: TreeNode[], section: DepositSection, out: Set<string>): void {
    for (const node of nodes) {
      if (node.children.length > 0) {
        out.add(this.branchKey(section, node.id));
        this.collectBranchKeys(node.children, section, out);
      }
    }
  }

  protected trackRow(index: number, row: FlatRow): string {
    if (row.kind === 'section') return 'section-' + row.sectionKey;
    return 'node-' + (row.node?.id ?? index);
  }

  protected rowNode(row: FlatRow): TreeNode {
    return row.node as TreeNode;
  }

  protected rowGuide(row: FlatRow): string {
    return row.guide ?? '';
  }

  protected rowSection(row: FlatRow): DepositSection {
    return row.section as DepositSection;
  }

  protected rowIsLeaf(row: FlatRow): boolean {
    return row.isLeaf ?? false;
  }

  protected isCollapsed(row: FlatRow): boolean {
    if (!row.node || !row.section) return false;
    return this.collapsed().has(this.branchKey(row.section, row.node.id));
  }

  protected isSectionCollapsed(key: DepositSection): boolean {
    return this.collapsedSections().has(key);
  }

  protected toggleSection(key: DepositSection): void {
    const s = new Set(this.collapsedSections());
    if (s.has(key)) {
      s.delete(key);
    } else {
      s.add(key);
      if (key === 'marsball') {
        s.add('bestiaire');
        s.add('rover');
      }
      const branches = new Set(this.collapsed());
      const targets = key === 'marsball'
        ? this.treeService.sections()
        : this.treeService.sections().filter(sec => sec.key === key);
      for (const target of targets) {
        this.collectBranchKeys(target.roots, target.key, branches);
      }
      this.collapsed.set(branches);
    }
    this.collapsedSections.set(s);
  }

  protected toggleCollapse(row: FlatRow): void {
    if (!row.node || !row.section) return;
    const key = this.branchKey(row.section, row.node.id);
    const s = new Set(this.collapsed());
    if (s.has(key)) {
      s.delete(key);
    } else {
      s.add(key);
      this.collectBranchKeys(row.node.children, row.section, s);
    }
    this.collapsed.set(s);
  }

  protected isSelected(node: TreeNode): boolean {
    return this.selectedLeaf()?.node === node;
  }

  protected nodeIsLeafDragOver(node: TreeNode): boolean {
    return this.treeDragOverLeafId() === node.id;
  }

  protected selectLeaf(node: TreeNode, section: DepositSection): void {
    const path = this.buildPath(node, section);
    this.selectedLeaf.set({ node, section, path });
    this.report.set(null);
    this.sendError.set(false);
  }

  private buildPath(node: TreeNode, section: DepositSection): string[] {
    const label = section.charAt(0).toUpperCase() + section.slice(1);
    const prefix = section === 'bestiaire' || section === 'rover' ? ['Marsball', label] : [label];
    const all = this.treeService.sections()
      .find(s => s.key === section)?.roots ?? [];
    const ancestors = this.findAncestors(all, node.id) ?? [];
    return [...prefix, ...ancestors.map(n => n.title), node.title];
  }

  private findAncestors(roots: TreeNode[], targetId: number): TreeNode[] | null {
    for (const root of roots) {
      if (root.id === targetId) return [];
      const sub = this.findAncestors(root.children, targetId);
      if (sub !== null) return [root, ...sub];
    }
    return null;
  }

  //========== TREE DRAG ==========//

  protected onTreeDragOver(event: DragEvent, row: FlatRow): void {
    if (row.kind !== 'node' || !row.isLeaf) return;
    event.preventDefault();
    this.treeDragOverLeafId.set(row.node!.id);
  }

  protected onTreeDragLeave(row: FlatRow): void {
    if (row.kind !== 'node' || !row.node) return;
    if (this.treeDragOverLeafId() === row.node.id) {
      this.treeDragOverLeafId.set(null);
    }
  }

  protected async onTreeDrop(event: DragEvent, row: FlatRow): Promise<void> {
    if (row.kind !== 'node' || !row.node || !row.section) return;
    event.preventDefault();
    this.treeDragOverLeafId.set(null);

    if (!row.isLeaf) return;

    this.selectLeaf(row.node, row.section);
    const files = await this.collectFiles(event.dataTransfer);
    this.addFiles(files);
  }

  //========== DEPOT DRAG ==========//

  protected onDepotDragOver(event: DragEvent): void {
    if (!this.selectedLeaf()) return;
    event.preventDefault();
    this.depotDragOver.set(true);
  }

  protected onDepotDragLeave(): void {
    this.depotDragOver.set(false);
  }

  protected async onDepotDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.depotDragOver.set(false);
    if (!this.selectedLeaf()) return;
    const files = await this.collectFiles(event.dataTransfer);
    this.addFiles(files);
  }

  //========== COLLECTE (FICHIERS ET DOSSIERS) ==========//

  private async collectFiles(dt: DataTransfer | null): Promise<File[]> {
    if (!dt) return [];

    const entries = Array.from(dt.items ?? [])
      .map(item => item.webkitGetAsEntry?.())
      .filter((entry): entry is FileSystemEntry => entry !== null && entry !== undefined);

    if (entries.length === 0) return Array.from(dt.files);

    const files: File[] = [];
    for (const entry of entries) {
      await this.readEntry(entry, files);
    }
    return files;
  }

  private readEntry(entry: FileSystemEntry, out: File[]): Promise<void> {
    if (entry.isFile) {
      return new Promise(resolve => {
        (entry as FileSystemFileEntry).file(file => { out.push(file); resolve(); }, () => resolve());
      });
    }

    if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      return new Promise(resolve => {
        const readBatch = (): void => {
          reader.readEntries(async batch => {
            if (batch.length === 0) { resolve(); return; }
            for (const child of batch) {
              await this.readEntry(child, out);
            }
            readBatch();
          }, () => resolve());
        };
        readBatch();
      });
    }

    return Promise.resolve();
  }

  //========== LOT ==========//

  private normalizeBase(name: string): string {
    const noExt = name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name;
    return noExt
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  private isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  private isTxtFile(file: File): boolean {
    return file.name.toLowerCase().endsWith('.txt');
  }

  private addFiles(files: File[]): void {
    this.report.set(null);
    this.sendError.set(false);

    for (const file of files) {
      if (!this.isImageFile(file) && !this.isTxtFile(file)) {
        continue;
      }

      const base = this.normalizeBase(file.name);
      const current = [...this.lot()];
      const existing = current.find(i => i.baseName === base);

      if (existing) {
        if (this.isImageFile(file)) {
          if (existing.objectUrl) URL.revokeObjectURL(existing.objectUrl);
          existing.image = file;
          existing.objectUrl = URL.createObjectURL(file);
        } else {
          existing.txt = file;
          this.readFirstLine(file, base);
        }
        this.lot.set([...current]);
      } else {
        const item: LotItem = {
          baseName: base,
          image: this.isImageFile(file) ? file : null,
          objectUrl: this.isImageFile(file) ? URL.createObjectURL(file) : null,
          txt: this.isTxtFile(file) ? file : null,
          txtFirstLine: null
        };
        if (item.txt) this.readFirstLine(file, base);
        this.lot.set([...current, item]);
      }
    }
  }

  private readFirstLine(file: File, base: string): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? '';
      const firstLine = text.split('\n')[0].trim();
      const current = [...this.lot()];
      const item = current.find(i => i.baseName === base);
      if (item) {
        item.txtFirstLine = firstLine;
        this.lot.set(current);
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  protected formattedTitle(item: LotItem): string {
    if (!item.image) return item.baseName;
    return this.formatter.format(item.image);
  }

  protected removeItem(item: LotItem): void {
    if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
    this.lot.set(this.lot().filter(i => i.baseName !== item.baseName));
  }

  protected clearLot(): void {
    for (const item of this.lot()) {
      if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
    }
    this.lot.set([]);
  }

  //========== ENVOI À ELENA ==========//

  protected async confierElena(): Promise<void> {
    const leaf = this.selectedLeaf();
    if (!leaf || this.lotEmpty() || this.sending()) return;

    const formData = new FormData();
    formData.append('section', leaf.section);
    formData.append('categoryId', String(leaf.node.id));
    for (const item of this.lot()) {
      if (item.image) formData.append('files', item.image);
      if (item.txt) formData.append('files', item.txt);
    }

    this.sending.set(true);
    this.sendError.set(false);

    try {
      const response = await firstValueFrom(
        this.http.post<{ report: ElenaLotReport }>(`${environment.apiUrl}/elena/lots`, formData)
      );
      this.report.set(response.report);
      this.clearLot();
      this.treeService.reload();
    } catch {
      this.sendError.set(true);
    } finally {
      this.sending.set(false);
    }
  }
}
