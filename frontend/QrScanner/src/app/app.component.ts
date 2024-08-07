import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {HttpClient} from '@angular/common/http'
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'QrScanner';
  fileForm!: FormGroup;
  responseData: any;
  data: any;
  isDataLoading: boolean = false;
  isUploadDisabled: boolean = false;
  pdfUrl: string = '';

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.fileForm = new FormGroup({
      qrImage: new FormControl('')
    });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fileForm.patchValue({
        qrImage: file
      });
    }
  }

  uploadButtonClicked(form: FormGroup) {
    this.isDataLoading = true;
    const formData = new FormData();
    formData.append('qrImage', form.get('qrImage')?.value);

    this.http.post<any>('http://localhost:8000/getscandetail', formData).subscribe(
      (res: any) => {
        console.log("Uploaded!!", res);
        this.responseData = res.extractedData;
        this.pdfUrl = res.pdfPath;
        this.data = this.responseData;
        this.isDataLoading = false;
        this.isUploadDisabled = true;
      },
      (err) => {
        console.error("Error uploading file:", err);
        this.isDataLoading = false;
        this.showError(err.error);
      }
    );
  }

  cancelButtonClicked() {
    this.fileForm.get('qrImage')?.setValue('');
    this.responseData = null;
    this.pdfUrl = '';
    this.data = null;
    console.log("Cancelled upload.");
  }

  showError(msg: string) {
    this.snackBar.open(msg, 'Error', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
  }
}
