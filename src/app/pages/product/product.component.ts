import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../shared/services/product.service';
import { EPageAction } from '../../shared/enums/category-page-action.enum';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MediaDto } from '../../shared/dtos/media.dto';
import { ProductDto } from '../../shared/dtos/product.dto';
import { NotyService } from '../../noty/noty.service';
import { QuillHelperService } from '../../shared/services/quill-helper.service';
import { Blur, QuillModules } from 'ngx-quill';
import { DEFAULT_CURRENCY_CODE, ECurrencyCode } from '../../shared/enums/currency.enum';
import { API_HOST } from '../../shared/constants/constants';
import { finalize } from 'rxjs/operators';
import { ProductVariantDto } from '../../shared/dtos/product-variant.dto';
import { LinkedProductDto } from '../../shared/dtos/linked-product.dto';
import { HeadService } from '../../shared/services/head.service';
import { IDraggedEvent } from '../../shared/directives/draggable-item/draggable-item.directive';
import { EReorderPosition } from '../../shared/enums/reorder-position.enum';
import { OrderListViewerModalComponent } from './order-list-viewer-modal/order-list-viewer-modal.component';
import { transliterate } from '../../shared/helpers/transliterate.function';
import { MetaTagsDto } from '../../shared/dtos/meta-tags.dto';

type PostAction = 'duplicate' | 'exit' | 'none';

@Component({
  selector: 'product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit {

  isNewProduct: boolean;
  product: ProductDto;
  form: FormGroup;
  currencies = ECurrencyCode;
  quillModules: QuillModules = this.quillHelperService.getEditorModules();
  isLoading: boolean = false;

  get variantsFormArray() { return this.form.get('variants') as FormArray; }
  get isMultiVariant(): boolean { return this.variantsFormArray.controls.length > 1 }

  @ViewChild(OrderListViewerModalComponent) ordersModal: OrderListViewerModalComponent;

  constructor(private productsService: ProductService,
              private formBuilder: FormBuilder,
              private router: Router,
              private headService: HeadService,
              private quillHelperService: QuillHelperService,
              private notyService: NotyService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.init();
  }

  private init() {
    this.isNewProduct = this.route?.snapshot.data.action === EPageAction.Add;
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.fetchProductAndBuildForm(id);
    } else {
      this.product = new ProductDto();
      this.buildForm();
      this.headService.setTitle(`Новый товар`);
    }
  }

  save(postAction: PostAction = 'none') {
    if (this.form.invalid) {
      this.notyService.showErrorNoty(`Ошибка в форме`);
      this.validateControls();
      return;
    }

    if (this.isNewProduct) {
      this.addNewProduct(postAction);
    } else {
      this.updateProduct(postAction);
    }
  }

  delete() {
    if (!confirm(`Вы действительно хотите удалить этот товар?`)) {
      return;
    }

    this.isLoading = true;
    this.productsService.deleteProduct(this.product.id)
      .pipe(this.notyService.attachNoty({ successText: 'Товар успешно удалён' }), finalize(() => this.isLoading = false))
      .subscribe(
        _ => {
          this.goBack();
        },
        error => console.warn(error)
      );
  }

  private buildForm() {
    const variantsFormArray = this.formBuilder.array([]);

    this.product.variants.forEach(variant => {
      const variantControls: Partial<Record<keyof ProductVariantDto, any>> = {
        id: [variant.id],
        name: [variant.name, Validators.required],
        slug: variant.slug,
        attributes: [variant.attributes],
        isEnabled: variant.isEnabled,
        price: [variant.price, Validators.required],
        oldPrice: [variant.oldPrice],
        currency: [variant.currency],
        vendorCode: [variant.vendorCode],
        gtin: [variant.gtin],
        isIncludedInShoppingFeed: [variant.isIncludedInShoppingFeed],
        googleAdsProductTitle: [variant.googleAdsProductTitle],
        medias: [variant.medias],
        fullDescription: variant.fullDescription,
        shortDescription: variant.shortDescription,
        metaTags: this.formBuilder.group({
          title: variant.metaTags.title,
          description: variant.metaTags.description,
          keywords: variant.metaTags.keywords
        }),
        qtyInStock: [variant.qtyInStock, Validators.required],
        isDiscountApplicable: variant.isDiscountApplicable
      };
      variantsFormArray.push(this.formBuilder.group(variantControls));
    });

    const productControls: Partial<Record<keyof ProductDto, any>> = {
      isEnabled: this.product.isEnabled,
      name: [this.product.name, Validators.required],
      categories: [this.product.categories],
      attributes: [this.product.attributes],
      variants: variantsFormArray
    }
    this.form = this.formBuilder.group(productControls);
  }

  private fetchProductAndBuildForm(id: string) {
    this.isLoading = true;
    this.productsService.fetchProduct(id)
      .pipe(this.notyService.attachNoty(), finalize(() => this.isLoading = false))
      .subscribe(
        response => {
          this.product = response.data;
          this.buildForm();
          this.headService.setTitle(this.product.name);
        },
        error => console.warn(error)
      );
  }

  private validateControls(form: FormGroup | FormArray = this.form) {
    Object.keys(form.controls).forEach(controlName => {
      const control = form.get(controlName);

      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup || control instanceof FormArray) {
        this.validateControls(control);
      }
    });
  }

  isControlInvalid(control: AbstractControl) {
    return !control.valid && control.touched;
  }

  private addNewProduct(postAction: PostAction) {
    const dto = this.mergeProducts(this.product, this.form.value);

    let successText: string = 'Товар успешно добавлен';
    if (postAction === 'duplicate') {
      successText = successText + '. Вы перенаправлены на страницу создания нового товара';
    }

    this.isLoading = true;
    this.productsService.addNewProduct(dto)
      .pipe(this.notyService.attachNoty({ successText }), finalize(() => this.isLoading = false))
      .subscribe(
        response => {
          let successUrlCommands: any[] = [];
          switch (postAction) {
            case 'duplicate':
              successUrlCommands = ['add', response.data.id];
              break;
            case 'none':
              successUrlCommands = ['edit', response.data.id];
              break;
          }

          this.router.navigate(['admin', 'product', ...successUrlCommands]);
        },
        error => console.warn(error)
      );
  }

  private updateProduct(postAction: PostAction) {
    const dto = this.mergeProducts(this.product, this.form.value)

    this.isLoading = true;
    this.productsService.updateProduct(this.product.id, dto)
      .pipe(this.notyService.attachNoty({ successText: 'Товар успешно обновлён' }), finalize(() => this.isLoading = false))
      .subscribe(
        response => {
          switch (postAction) {
            case 'duplicate':
              this.router.navigate(['admin', 'product', 'add', response.data.id]);
              break;
            case 'exit':
              this.router.navigate(['admin', 'product']);
              break;
            case 'none':
              this.product = response.data;
              this.buildForm();
              break;
          }
        },
        error => console.warn(error)
      );
  }

  getMediaUploadUrl() {
    return `${API_HOST}/api/v1/admin/products/media`;
  }

  mediaUploaded(media: MediaDto, mediasControl: AbstractControl) {
    mediasControl.value.push(media);
  }

  onMediaRemove(media: MediaDto, mediasControl: AbstractControl) {
    const controlValue = mediasControl.value as MediaDto[];
    const index = controlValue.findIndex(value => value.variantsUrls.original === media.variantsUrls.original);
    if (index !== -1) {
      controlValue.splice(index, 1);
    }
  }

  onAttributesEdit(generatedFormValue: ProductDto) {
    this.product = this.mergeProducts(this.product, generatedFormValue);
    this.buildForm();
  }

  goBack() {
    this.router.navigate(['admin', 'product']);
  }

  isDefaultCurrency(variantIdx: number): boolean {
    return this.product.variants[variantIdx].currency === DEFAULT_CURRENCY_CODE;
  }

  onChangeRelatedProducts(products: LinkedProductDto[], index: number) {
    this.product.variants[index].relatedProducts = products;
  }

  onChangeCrossSellProducts(products: LinkedProductDto[], index: number) {
    this.product.variants[index].crossSellProducts = products;
  }

  private mergeProducts(product1: ProductDto, product2: ProductDto): ProductDto {
    const variants = [];
    product2.variants.forEach((product2Variant, index) => {
      let resultVariant = { ...product2Variant };

      const product1Variant = product1.variants[index];
      if (product1Variant) {
        resultVariant = { ...product1Variant, ...resultVariant };
      }

      variants.push(resultVariant);
    });

    return {
      ...product1,
      ...product2,
      variants
    };
  }

  onMediaReorder(mediasControl: AbstractControl, event: IDraggedEvent) {
    const medias: MediaDto[] = mediasControl.value;
    const itemIdx = medias.indexOf(event.item);
    const [itemToMove] = medias.splice(itemIdx, 1);
    const targetIdx = medias.indexOf(event.targetItem);

    let indexWhereToInsert: number;
    if (event.position === EReorderPosition.Start) {
      indexWhereToInsert = targetIdx;
    } else {
      indexWhereToInsert = targetIdx + 1;
    }

    medias.splice(indexWhereToInsert, 0, itemToMove);

    mediasControl.setValue(medias);
  }

  showReservedOrders(variantIdx: number) {
    const variant = this.product.variants[variantIdx];

    this.productsService.fetchOrderIdsForReservedVariant(this.product.id, variant.id)
      .pipe(this.notyService.attachNoty())
      .subscribe(
        response => {
          this.ordersModal.openModal(variant.sku, response.data);
        }
      );
  }

  onNameControlBlur(nameControl: AbstractControl, variantIndex: number) {
    const name: string = nameControl.value;
    if (!name) { return; }

    if (variantIndex === 0) {
      const nameProp: keyof ProductDto = 'name';
      this.form.get(nameProp).setValue(name);
    }

    const variantForm = this.variantsFormArray.controls[variantIndex];

    const slugProp: keyof ProductVariantDto = 'slug';
    const slugControl = variantForm.get(slugProp);
    if (!slugControl.value) {
      slugControl.setValue(transliterate(name));
    }

    const metaProp: keyof ProductVariantDto = 'metaTags';
    const titleProp: keyof MetaTagsDto = 'title';
    const titleControl = variantForm.get(`${metaProp}.${titleProp}`);
    if (!titleControl.value) {
      titleControl.setValue(`Купить ${name[0].toLowerCase()}${name.slice(1)}`);
    }
  }

  onDescriptionControlBlur(quillBlurEvent: Blur, variantIndex: number) {
    const description: string = quillBlurEvent.editor.getText();
    if (!description) { return; }

    const variantForm = this.variantsFormArray.controls[variantIndex];
    const metaProp: keyof ProductVariantDto = 'metaTags';
    const descriptionProp: keyof MetaTagsDto = 'description';
    const metaDescriptionControl = variantForm.get(`${metaProp}.${descriptionProp}`);
    if (!metaDescriptionControl.value) {
      metaDescriptionControl.setValue(description);
    }
  }
}
