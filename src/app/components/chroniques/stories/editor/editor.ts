import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PrivateStoriesService } from '../../../../services/private-stories.service';
import { AuthService } from '../../../../services/auth.service';
import { ConfirmationDialogService } from '../../../../services/confirmation-dialog.service';

@Component({
  selector: 'app-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './editor.html',
  styleUrl: './editor.scss'
})
export class Editor implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private stories = inject(PrivateStoriesService);
  private auth = inject(AuthService);
  private dialog = inject(ConfirmationDialogService);

  mode = signal<'nouvelle' | 'continuer' | 'modifier'>('nouvelle');
  form = signal({ title: '', content: '' });
  loading = signal(false);

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return;
    }

    this.loadStory();
  }

  async loadStory(): Promise<void> {
    const id = this.route.snapshot.params['id'];
    
    if (!id) {
      this.mode.set('nouvelle');
      return;
    }

    this.loading.set(true);
    try {
      const story = await this.stories.getStory(parseInt(id));
      if (story) {
        this.form.set({
          title: story.title,
          content: story.content
        });
        this.mode.set(story.status === 'DRAFT' ? 'continuer' : 'modifier');
      }
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    this.loading.set(true);
    try {
      const data = this.form();
      if (this.mode() === 'nouvelle') {
        await this.stories.createDraft(data);
      } else {
        const id = this.route.snapshot.params['id'];
        await this.stories.updateDraft(parseInt(id), data);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async publish(): Promise<void> {
    this.loading.set(true);
    try {
      const id = this.route.snapshot.params['id'];
      await this.stories.publishStory(parseInt(id));
      await this.router.navigate(['/chroniques']);
    } finally {
      this.loading.set(false);
    }
  }

  async delete(): Promise<void> {
    const id = this.route.snapshot.params['id'];
    const isNouvelle = this.mode() === 'nouvelle';
    
    const confirmed = await this.dialog.confirm({
      title: isNouvelle ? 'Annuler la création' : 'Suppression du brouillon',
      message: isNouvelle 
        ? 'Êtes-vous sûr de vouloir annuler la création de cette histoire ?'
        : 'Êtes-vous sûr de vouloir supprimer ce brouillon ?',
      confirmText: isNouvelle ? 'Annuler' : 'Supprimer',
      cancelText: 'Retour',
      isDanger: true
    });

    if (!confirmed) return;

    this.loading.set(true);
    try {
      if (isNouvelle) {
        await this.stories.cancelNewStory(parseInt(id));
      } else {
        await this.stories.deleteDraft(parseInt(id));
      }
      await this.router.navigate(['/chroniques/my-stories']);
    } finally {
      this.loading.set(false);
    }
  }
}