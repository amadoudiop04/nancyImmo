
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService, Building } from '../../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
      <div class="rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200 p-6 sm:p-10">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs font-extrabold tracking-[0.22em] uppercase text-orange-700 mb-3">
              Application de gestion immobiliere
            </p>
            <h1 class="text-4xl sm:text-5xl font-black leading-[0.95] text-slate-900">
              Buildings
            </h1>
            <p class="mt-3 text-slate-600 leading-7 max-w-2xl">
              Cette page charge les données retournées par votre API Spring Boot et les affiche directement.
            </p>
          </div>
    
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-green-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:brightness-105"
            (click)="loadBuildings()"
            >
            Rafraîchir
          </button>
        </div>
    
        <div class="mt-6 grid gap-6 lg:grid-cols-2">
          <div class="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <h2 class="text-lg font-bold text-slate-900 mb-4">Ajouter un building</h2>
    
            <form class="grid gap-3" (ngSubmit)="addBuilding()">
              <input
                [(ngModel)]="newBuilding.name"
                name="name"
                type="text"
                placeholder="Nom"
                class="rounded-xl border border-slate-300 px-4 py-3 focus:border-orange-500 focus:outline-none"
                />
                <input
                  [(ngModel)]="newBuilding.street"
                  name="street"
                  type="text"
                  placeholder="Rue"
                  class="rounded-xl border border-slate-300 px-4 py-3 focus:border-orange-500 focus:outline-none"
                  />
                  <input
                    [(ngModel)]="newBuilding.city"
                    name="city"
                    type="text"
                    placeholder="Ville"
                    class="rounded-xl border border-slate-300 px-4 py-3 focus:border-orange-500 focus:outline-none"
                    />
                    <input
                      [(ngModel)]="newBuilding.zipCode"
                      name="zipCode"
                      type="text"
                      placeholder="Code postal"
                      class="rounded-xl border border-slate-300 px-4 py-3 focus:border-orange-500 focus:outline-none"
                      />
                      <input
                        [(ngModel)]="newBuilding.country"
                        name="country"
                        type="text"
                        placeholder="Pays"
                        class="rounded-xl border border-slate-300 px-4 py-3 focus:border-orange-500 focus:outline-none"
                        />
    
                        <button
                          type="submit"
                          class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-teal-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-green-500/25 hover:brightness-105"
                          >
                          Ajouter
                        </button>
                      </form>
                    </div>
    
                    <div class="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                      <h2 class="text-lg font-bold text-slate-900 mb-4">Buildings enregistrés</h2>
    
                      @if (isLoading) {
                        <p class="text-slate-600">Chargement des buildings...</p>
                      }
                      @if (errorMessage) {
                        <p class="text-red-600">{{ errorMessage }}</p>
                      }
    
                      @if (!isLoading && !errorMessage) {
                        @if (buildings.length > 0) {
                          <ul class="space-y-3">
                            @for (building of buildings; track building) {
                              <li class="rounded-xl border border-slate-200 bg-white p-4">
                                @if (editingBuildingId !== building.id) {
                                  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <p class="font-semibold text-slate-900">{{ building.name }}</p>
                                      <p class="text-sm text-slate-600">
                                        {{ building.street }}, {{ building.zipCode }} {{ building.city }}, {{ building.country }}
                                      </p>
                                    </div>
                                    <div class="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        class="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                        (click)="startEdit(building)"
                                        >
                                        Modifier
                                      </button>
                                      <button
                                        type="button"
                                        class="rounded-full bg-gradient-to-r from-red-500 to-pink-600 px-3 py-1.5 text-sm font-semibold text-white hover:brightness-105"
                                        (click)="deleteBuilding(building.id)"
                                        >
                                        Supprimer
                                      </button>
                                    </div>
                                  </div>
                                } @else {
                                  <div class="grid gap-3">
                                    <input
                                      [(ngModel)]="editingBuilding.name"
                                      name="editingName"
                                      type="text"
                                      class="rounded-xl border border-slate-300 px-4 py-3 focus:border-orange-500 focus:outline-none"
                                      />
                                      <input
                                        [(ngModel)]="editingBuilding.street"
                                        name="editingStreet"
                                        type="text"
                                        class="rounded-xl border border-slate-300 px-4 py-3 focus:border-orange-500 focus:outline-none"
                                        />
                                        <input
                                          [(ngModel)]="editingBuilding.city"
                                          name="editingCity"
                                          type="text"
                                          class="rounded-xl border border-slate-300 px-4 py-3 focus:border-orange-500 focus:outline-none"
                                          />
                                          <input
                                            [(ngModel)]="editingBuilding.zipCode"
                                            name="editingZipCode"
                                            type="text"
                                            class="rounded-xl border border-slate-300 px-4 py-3 focus:border-orange-500 focus:outline-none"
                                            />
                                            <input
                                              [(ngModel)]="editingBuilding.country"
                                              name="editingCountry"
                                              type="text"
                                              class="rounded-xl border border-slate-300 px-4 py-3 focus:border-orange-500 focus:outline-none"
                                              />
                                              <div class="flex flex-wrap gap-2">
                                                <button
                                                  type="button"
                                                  class="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:brightness-105"
                                                  (click)="saveEdit()"
                                                  >
                                                  Enregistrer
                                                </button>
                                                <button
                                                  type="button"
                                                  class="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                                  (click)="cancelEdit()"
                                                  >
                                                  Annuler
                                                </button>
                                              </div>
                                            </div>
                                          }
                                        </li>
                                      }
                                    </ul>
                                  } @else {
                                    <p class="text-slate-500">Aucun building trouvé.</p>
                                  }
                                }
                              </div>
                            </div>
                          </div>
                        </section>
    `,
})
export class HomeComponent implements OnInit {
  buildings: Building[] = [];
  isLoading = false;
  errorMessage = '';
  editingBuildingId: number | null = null;
  editingBuilding: Omit<Building, 'id'> = this.emptyBuilding();
  newBuilding: Omit<Building, 'id'> = this.emptyBuilding();

  private apiService = inject(ApiService);

  ngOnInit(): void {
    this.loadBuildings();
  }

  loadBuildings(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getBuildings().subscribe({
      next: (data) => {
        this.buildings = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching buildings:', error);
        this.errorMessage = 'Impossible de charger les buildings.';
        this.isLoading = false;
      },
    });
  }

  addBuilding(): void {
    this.apiService.addBuilding(this.newBuilding).subscribe({
      next: () => {
        this.newBuilding = this.emptyBuilding();
        this.loadBuildings();
      },
      error: (error) => {
        console.error('Error adding building:', error);
        this.errorMessage = 'Impossible dajouter le building.';
      },
    });
  }

  startEdit(building: Building): void {
    this.editingBuildingId = building.id;
    this.editingBuilding = {
      name: building.name,
      street: building.street,
      city: building.city,
      zipCode: building.zipCode,
      country: building.country,
    };
  }

  cancelEdit(): void {
    this.editingBuildingId = null;
    this.editingBuilding = this.emptyBuilding();
  }

  saveEdit(): void {
    if (this.editingBuildingId === null) {
      return;
    }

    this.apiService.modifyBuilding(this.editingBuildingId, this.editingBuilding).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadBuildings();
      },
      error: (error) => {
        console.error('Error updating building:', error);
        this.errorMessage = 'Impossible de modifier le building.';
      },
    });
  }

  deleteBuilding(id: number): void {
    this.apiService.deleteBuilding(id).subscribe({
      next: () => this.loadBuildings(),
      error: (error) => {
        console.error('Error deleting building:', error);
        this.errorMessage = 'Impossible de supprimer le building.';
      },
    });
  }

  private emptyBuilding(): Omit<Building, 'id'> {
    return {
      name: '',
      street: '',
      city: '',
      zipCode: '',
      country: '',
    };
  }
}
