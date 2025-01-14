"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const file_helpers_1 = require("../helpers/file-helpers");
class FileUploadService {
    constructor(axiosInstance, presigned_url, folder = '', ACL = 'public-read') {
        this.folder = '';
        this.name = '';
        this.ACL = 'private';
        this.ContentType = '';
        this.extension = '';
        this.size = 0;
        this.lastModified = '';
        this.source = null;
        this.imageMaxWidth = 1980;
        this.imageMaxHeight = 1980;
        this.imageQuality = 0.8;
        this.status = 'Empty';
        this.progress = 0;
        this.fileContentBlob = null;
        this.file_path = '';
        this.file_name = '';
        this.presigned_url = '';
        this.isLoading = false;
        this.presigned_url = presigned_url;
        this.folder = folder;
        this.ACL = ACL;
        this.axiosInstance = axiosInstance;
    }
    get color() {
        return (0, file_helpers_1.formatFileColor)(this.name);
    }
    get formatted_name() {
        var _a;
        return (_a = (0, file_helpers_1.formatFileName)(this.name)) !== null && _a !== void 0 ? _a : '';
    }
    get formatted_size() {
        var _a;
        return (_a = (0, file_helpers_1.formatFileSize)(this.size)) !== null && _a !== void 0 ? _a : '0kb';
    }
    wait(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
    setFile(file) {
        var _a;
        this.name = file.name;
        this.ContentType = file.type;
        this.size = file.size;
        this.lastModified = file.lastModified;
        this.extension = '.' + ((_a = this.name.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
        this.source = file;
        this.status = 'Selected';
        this.setExtensionAndNameForImageToImprovePerformance();
    }
    setFileFromMediaRecorded(ContentType = 'video/webm', recordedChunks) {
        this.ContentType = ContentType;
        this.extension = '.' + ContentType.split('/').pop() || 'webm';
        this.name = `recorded_at_${new Date().getTime()}${this.extension}`;
        this.status = 'Selected';
        this.fileContentBlob = new Blob(recordedChunks, { type: ContentType });
    }
    setFileFromBlob(blob, ContentType = 'image/webp') {
        if (!blob) {
            throw new Error('Blob is required');
        }
        this.ContentType = ContentType;
        this.extension = '.' + ContentType.split('/').pop() || 'webp';
        this.name = `image_${new Date().getTime()}${this.extension}`;
        this.status = 'Selected';
        this.fileContentBlob = blob;
        this.source = blob;
        this.setExtensionAndNameForImageToImprovePerformance();
    }
    setExtensionAndNameForImageToImprovePerformance() {
        if (this.getFileIsImage) {
            this.extension = '.webp';
            this.name = `${this.name.split('.').shift()}.webp`;
        }
    }
    upload() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isLoading)
                return;
            try {
                this.isLoading = true;
                yield this.readFileAndUpload();
            }
            catch (error) {
                console.error(error);
                throw error;
            }
            finally {
                this.isLoading = false;
            }
        });
    }
    uploadBlob() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isLoading)
                return;
            try {
                this.isLoading = true;
                yield this.uploadFileToAws();
            }
            catch (error) {
                console.error(error);
                throw error;
            }
            finally {
                this.isLoading = false;
            }
        });
    }
    uploadRecordedMedia() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isLoading)
                return;
            try {
                this.isLoading = true;
                yield this.uploadFileToAws();
            }
            catch (error) {
                console.error(error);
                throw error;
            }
            finally {
                this.isLoading = false;
            }
        });
    }
    get getFileIsImage() {
        return this.ContentType.includes('image');
    }
    getPresignedUrlFromApi() {
        return __awaiter(this, void 0, void 0, function* () {
            const { folder: folder_path, presigned_url, extension, ACL, ContentType, name } = this;
            try {
                const { data } = yield this.axiosInstance.post(presigned_url, { folder_path, extension, name, ContentType, ACL });
                this.file_path = data.file_path;
                this.file_name = data.file_name;
                this.presigned_url = data.presigned_url;
            }
            catch (err) {
                console.error(err);
                throw err;
            }
        });
    }
    readFileAndUpload() {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => __awaiter(this, void 0, void 0, function* () {
                this.status = 'Preparing';
                if (this.getFileIsImage) {
                    this.fileContentBlob = yield this.convertImageToWebp(event.target.result);
                }
                else {
                    this.fileContentBlob = event.target.result;
                }
                try {
                    yield this.uploadFileToAws();
                    resolve();
                }
                catch (error) {
                    this.status = 'Error';
                    reject(error);
                }
            });
            reader.onerror = (error) => {
                this.status = 'Error';
                reject(error);
            };
            if (this.getFileIsImage) {
                reader.readAsDataURL(this.source);
            }
            else {
                reader.readAsArrayBuffer(this.source);
            }
        });
    }
    convertImageToWebp(image) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    const img = new Image();
                    img.src = image;
                    img.onload = () => {
                        let newWidth = this.imageMaxWidth;
                        let newHeight = this.imageMaxHeight;
                        const aspectRatio = img.width / img.height;
                        if (aspectRatio > 1) {
                            newHeight = Math.min(this.imageMaxHeight, this.imageMaxWidth / aspectRatio);
                        }
                        else {
                            newWidth = Math.min(this.imageMaxWidth, this.imageMaxHeight * aspectRatio);
                        }
                        const canvas = document.createElement('canvas');
                        canvas.width = newWidth;
                        canvas.height = newHeight;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            reject(new Error('Canvas context is null'));
                            return;
                        }
                        ctx.drawImage(img, 0, 0, newWidth, newHeight);
                        canvas.toBlob((blob) => {
                            if (!blob) {
                                reject(new Error('Conversion to WebP failed'));
                                return;
                            }
                            resolve(blob);
                        }, 'image/webp', this.imageQuality);
                    };
                }
                catch (error) {
                    console.error(error);
                    reject(error);
                }
            });
        });
    }
    uploadFileToAws(multipart_chunk) {
        return new Promise((resolve, reject) => {
            this.status = 'Uploading';
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', multipart_chunk ? multipart_chunk.presigned_url : this.presigned_url, true);
            xhr.setRequestHeader('Content-Type', this.ContentType);
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentage = (e.loaded / e.total) * 100;
                    this.progress = percentage;
                    if (multipart_chunk)
                        multipart_chunk.progress = percentage;
                }
            };
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        this.status = 'Complete';
                        const ETag = xhr.getResponseHeader("ETag");
                        if (ETag && multipart_chunk) {
                            multipart_chunk.ETag = ETag.replace(/"/g, "");
                        }
                        resolve();
                    }
                    else {
                        this.status = 'Error';
                        console.error('File upload failed.');
                        reject();
                    }
                }
            };
            xhr.send(multipart_chunk ? multipart_chunk.file : this.fileContentBlob);
        });
    }
}
exports.default = FileUploadService;
