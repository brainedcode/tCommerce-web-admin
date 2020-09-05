import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AddOrUpdateProductDto, ProductListItemDto, ProductDto } from '../dtos/product.dto';
import { toHttpParams } from '../helpers/to-http-params.function';
import { ResponseDto } from '../dtos/response.dto';
import { IGridValue } from '../../grid/grid.interface';
import { API_HOST } from '../constants/constants';
import { EReorderPosition } from '../enums/reorder-position.enum';
import { ProductReorderDto } from '../dtos/reorder.dto';

interface IFetchProductsParams extends IGridValue {
  orderedDates?: [string, string];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private http: HttpClient) {
  }

  fetchAllProducts(paramsArg: IFetchProductsParams, withVariants: boolean) {
    const params: any = paramsArg;
    params.withVariants = withVariants;

    return this.http.get<ResponseDto<ProductListItemDto[]>>(
      `${API_HOST}/api/v1/admin/products`,
      { params: toHttpParams(params) }
    );
  }

  fetchProduct(id: string | number): Observable<ResponseDto<ProductDto>> {
    return this.http.get<ResponseDto<ProductDto>>(`${API_HOST}/api/v1/admin/products/${id}`);
  }

  addNewProduct(dto: AddOrUpdateProductDto): Observable<ResponseDto<ProductDto>> {
    return this.http.post<ResponseDto<ProductDto>>(`${API_HOST}/api/v1/admin/products`, dto);
  }

  updateProduct(id: number, dto: AddOrUpdateProductDto): Observable<ResponseDto<ProductDto>> {
    return this.http.put<ResponseDto<ProductDto>>(`${API_HOST}/api/v1/admin/products/${id}`, dto);
  }

  reorderProduct(
    item: ProductListItemDto,
    target: ProductListItemDto,
    position: EReorderPosition,
    categoryId: number,
    filter: IGridValue
  ) {
    const apiUrl = `${API_HOST}/api/v1/admin/products/action/reorder`;
    const reorderDto: ProductReorderDto = {
      id: item.id,
      targetId: target.id,
      position,
      categoryId
    };

    return this.http.post<ResponseDto<ProductListItemDto[]>>(
      apiUrl,
      reorderDto,
      { params: toHttpParams(filter) }
    );
  }

  deleteProduct(id: number) {
    return this.http.delete<any>(`${API_HOST}/api/v1/admin/products/${id}`);
  }

  fetchOrderIdsForReservedVariant(id: number, variantId: string) {
    return this.http.get<ResponseDto<number[]>>(`${API_HOST}/api/v1/admin/products/${id}/variants/${variantId}/reserved`)
  }

  getGoogleShoppingFeedUrl(): string {
    return `${API_HOST}/api/v1/feed/shopping`;
  }

  getGoogleReviewsFeedUrl(): string {
    return `${API_HOST}/api/v1/feed/reviews`;
  }
}
