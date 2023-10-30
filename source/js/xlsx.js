import axios from "axios";

class XLSX {
    constructor(data, filename, csrfToken) {
        this.data = data;
        this.filename = filename;
        this.csrfToken = csrfToken;
    }

    download() {
        return new Promise((resolve, reject) => {

            axios.post("/api/exportar/", this.data, {
                headers: {"X-CSRFToken": this.csrfToken},
                responseType: "blob"
            }).then((res) => {
                const data = res.data;
                const a = document.createElement("a");
                a.href = window.URL.createObjectURL(data);
                a.download = this.filename + ".xlsx";
                a.click();
                window.URL.revokeObjectURL(data);
                resolve();
            }).catch((error) => reject(error));
        });
    }
}

export default XLSX;