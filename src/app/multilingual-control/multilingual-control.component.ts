import { Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Language } from '../shared/enums/language.enum';
import { MultilingualTextDto } from '../shared/dtos/multilingual-text.dto';
import { QuillModules } from 'ngx-quill';
import { QuillHelperService } from '../shared/services/quill-helper.service';

@Component({
  selector: 'multilingual-control',
  templateUrl: './multilingual-control.component.html',
  styleUrls: ['./multilingual-control.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MultilingualControlComponent),
    multi: true
  }]
})
export class MultilingualControlComponent implements OnInit, ControlValueAccessor {

  form: FormGroup;
  languages: Language[] = [Language.UK, Language.RU];
  activeLanguage: Language = this.languages[0];
  languagesEnum = Language;
  quillModules: QuillModules = this.quillHelperService.getEditorModules();

  private get value(): MultilingualTextDto { return this.form.getRawValue(); }

  @Input() type: 'text' | 'textarea' | 'editor' = 'text';
  @Input() id: string;
  @Output() onBlur = new EventEmitter<MultilingualTextDto>();

  constructor(
    private formBuilder: FormBuilder,
    private quillHelperService: QuillHelperService
  ) { }

  ngOnInit(): void {
    this.buildControls();
  }

  onChange = (_: any) => { };

  onTouched = () => { };

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    const controls = Object.values(this.form.controls);
    controls.forEach(control => {
      isDisabled ? control.disable() : control.enable()
    });
  }

  writeValue(value: MultilingualTextDto): void {
    Object.entries(value).forEach(([lang, text]) => {
      const control = this.form.get(lang);
      control.setValue(text);
    });
  }

  private buildControls() {
    const controlsConfig: MultilingualTextDto = {
      [Language.UK]: '',
      [Language.RU]: '',
      [Language.EN]: ''
    };

    this.form = this.formBuilder.group(controlsConfig);
  }

  onControlBlur() {
    this.onBlur.emit(this.value);
  }
}
