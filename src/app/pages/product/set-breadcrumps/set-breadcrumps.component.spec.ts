import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetBreadcrumpsComponent } from './set-breadcrumps.component';

describe('SetBreadcrumpsComponent', () => {
  let component: SetBreadcrumpsComponent;
  let fixture: ComponentFixture<SetBreadcrumpsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetBreadcrumpsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetBreadcrumpsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
