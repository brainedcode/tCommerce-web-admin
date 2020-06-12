import { AfterViewInit, ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { OrderDto } from '../../../shared/dtos/order.dto';
import { IGridCell, IGridValue } from '../../../grid/grid.interface';
import { DEFAULT_CURRENCY_CODE } from '../../../shared/enums/currency.enum';
import { GridComponent } from '../../../grid/grid.component';
import { OrderService } from '../../../shared/services/order.service';
import { ActivatedRoute } from '@angular/router';
import { NotyService } from '../../../noty/noty.service';
import { finalize } from 'rxjs/operators';
import { getPropertyOf } from '../../../shared/helpers/get-property-of.function';
import { ShipmentAddressDto } from '../../../shared/dtos/shipment-address.dto';
import { ShipmentDto } from '../../../shared/dtos/shipment.dto';

@Component({
  selector: 'order-list-viewer',
  templateUrl: './order-list-viewer.component.html',
  styleUrls: ['./order-list-viewer.component.scss']
})
export class OrderListViewerComponent implements OnInit, AfterViewInit {

  private fetchAllSub: Subscription;

  orders: OrderDto[] = [];
  itemsTotal: number = 0;
  itemsFiltered: number;
  pagesTotal: number = 1;
  isGridLoading: boolean = false;
  gridLinkUrl: string = 'view';
  gridCells: IGridCell[] = orderGridCells;
  defaultCurrency = DEFAULT_CURRENCY_CODE;

  @Input() customerId: number;
  @ViewChild(GridComponent) gridCmp: GridComponent;

  constructor(private ordersService: OrderService,
              private cdr: ChangeDetectorRef,
              private route: ActivatedRoute,
              private notyService: NotyService) {
  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    if (!this.customerId) { return; }

    const gridValue = this.gridCmp.getValue();
    this.fetchOrders(gridValue);
  }

  fetchOrders(gridValue: IGridValue) {
    if (this.fetchAllSub) { this.fetchAllSub.unsubscribe(); }

    this.isGridLoading = true;
    this.cdr.detectChanges();
    this.fetchAllSub = this.ordersService.fetchOrders(gridValue, this.customerId)
      .pipe(this.notyService.attachNoty(), finalize(() => this.isGridLoading = false))
      .subscribe(
        response => {
          this.orders = response.data;
          this.itemsTotal = response.itemsTotal;
          this.itemsFiltered = response.itemsFiltered;
          this.pagesTotal = response.pagesTotal;
        },
        error => console.warn(error)
      );
  }
}

const orderGridCells: IGridCell[] = [
  {
    isSearchable: false,
    label: 'ID',
    initialWidth: 50,
    align: 'center',
    isImage: false,
    isSortable: true,
    fieldName: getPropertyOf<OrderDto>('id')
  },
  {
    isSearchable: false,
    label: 'Дата',
    initialWidth: 100,
    align: 'left',
    isImage: false,
    isSortable: true,
    fieldName: getPropertyOf<OrderDto>('createdAt')
  },
  {
    isSearchable: true,
    label: 'Город',
    initialWidth: 100,
    align: 'left',
    isImage: false,
    isSortable: true,
    fieldName: `${getPropertyOf<OrderDto>('shipment')}.${getPropertyOf<ShipmentDto>('recipient')}.${getPropertyOf<ShipmentAddressDto>('settlement')}`
  },
  {
    isSearchable: true,
    label: 'Сумма',
    initialWidth: 75,
    align: 'left',
    isImage: false,
    isSortable: true,
    fieldName: getPropertyOf<OrderDto>('totalCost')
  },
  {
    isSearchable: false,
    label: 'Статус',
    initialWidth: 65,
    align: 'left',
    isImage: false,
    isSortable: true,
    fieldName: getPropertyOf<OrderDto>('status')
  },
  {
    isSearchable: true,
    label: 'Комментарий админа',
    initialWidth: 250,
    align: 'left',
    isImage: false,
    isSortable: true,
    fieldName: getPropertyOf<OrderDto>('adminNote')
  },
  {
    isSearchable: true,
    label: 'ТТН',
    initialWidth: 150,
    align: 'left',
    isImage: false,
    isSortable: false,
    fieldName: `${getPropertyOf<ShipmentDto>('recipient')}.${getPropertyOf<ShipmentDto>('trackingNumber')}`
  },
  {
    isSearchable: true,
    label: 'Комментарий клиента',
    initialWidth: 150,
    align: 'left',
    isImage: false,
    isSortable: true,
    fieldName: getPropertyOf<OrderDto>('clientNote')
  }
];
