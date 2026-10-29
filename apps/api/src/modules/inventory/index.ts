// Public API of the inventory module: the only file other modules (and app.module) may import.
export { InventoryModule } from './inventory.module';
export { InventoryService } from './inventory.service';
export { materialCost, stockBySede } from './domain/inventory.rules';
