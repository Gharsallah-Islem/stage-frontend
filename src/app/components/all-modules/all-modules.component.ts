import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-all-modules',
  templateUrl: './all-modules.component.html',
  styleUrls: ['./all-modules.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule],
  animations: [
    trigger('rowAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class AllModulesComponent implements OnInit {
  modules: any[] = [];
  isModalOpen = false;
  selectedModule: any = null;
  moduleName = '';

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadModules();
  }

  loadModules(): void {
    this.adminService.getAllModules().subscribe((data) => {
      this.modules = data;
    });
  }

  openAddModule(): void {
    this.isModalOpen = true;
    this.selectedModule = null;
    this.moduleName = '';
  }

  openEditModule(module: any): void {
    this.isModalOpen = true;
    this.selectedModule = module;
    this.moduleName = module.name;
  }

  saveModule(): void {
    if (this.selectedModule) {
      this.adminService.updateModule(this.selectedModule.id, { name: this.moduleName }).subscribe(() => {
        this.loadModules();
        this.closeModal();
      });
    } else {
      this.adminService.addModule({ name: this.moduleName }).subscribe(() => {
        this.loadModules();
        this.closeModal();
      });
    }
  }

  deleteModule(moduleId: number): void {
    if (confirm('Are you sure you want to delete this module?')) {
      this.adminService.deleteModule(moduleId).subscribe(() => {
        this.loadModules();
      });
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
  }
}