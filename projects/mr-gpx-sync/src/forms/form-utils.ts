import { FormGroup } from '@angular/forms';

export function setFormValue(form: FormGroup, name: string, value: any): void {
  let formControl = form.get(name);
  if (formControl) {
    formControl.setValue(value);
  }
}
