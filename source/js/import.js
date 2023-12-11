import axios from "axios";
import Swal from "sweetalert2";

document.addEventListener("DOMContentLoaded", main);

function main() {
  const form = document.querySelector("#import-form");
  const resultBodyTemplate = document.getElementById("result-body-template")
  const resultItemTemplate = document.getElementById("result-item-template")
  const resultSubItemTemplate = document.getElementById("result-sub-item-template")
  const resultItemRow = document.getElementById("result-item-row");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const url = form.action;
    Swal.fire({
      "text": "Importando reporte, esto puede tomar un tiempo..."
    });
    Swal.showLoading();

    axios.post(url, data).then(res => {
      try {
        Swal.close()
        const htmlBody = resultBodyTemplate.content.cloneNode(true);
        const contentElement = htmlBody.querySelector("[name='content']");
        const itemClasses = {
          "total": "list-group-item-info",
          "created": "list-group-item-success",
          "omitted": "list-group-item-warning",
          "failed": "list-group-item-danger",
        }
        const itemKeys = {
          "created": "creados",
          "omitted": "omitidos",
          "failed": "fallidos",
          "total": "totales"

        }
        for (let item in res.data) {
          const id = "item-" + item;
          const htmlItem = resultItemTemplate.content.cloneNode(true)
          const title = htmlItem.querySelector('[name="title"]');
          title.textContent = item.replaceAll("_", " ");
          title.setAttribute("data-bs-target", "#" + id);
          const {errors, ...itemData} = res.data[item];
          const collapseContainer = htmlItem.querySelector('[name="collapse-container"]');
          collapseContainer.id = id;
          const summaryElement = htmlItem.querySelector("[name='summary']");
          for (let key in itemData) {
            const row = resultItemRow.content.cloneNode(true);
            const className = itemClasses[key] ? itemClasses[key] : "no-class";
            row.querySelector("li").classList.add(className);
            row.className += className;
            const keyElement = row.querySelector("[name='key']")
            const valueElement = row.querySelector("[name='value']")
            keyElement.textContent = itemKeys[key]
            valueElement.textContent = itemData[key]
            summaryElement.appendChild(row)
          }
          const subItem = resultSubItemTemplate.content.cloneNode(true);
          const titleBtn = subItem.querySelector("[name='title']");
          const errorsId = "errors-" + item + "-id";
          titleBtn.textContent = "Errores"
          titleBtn.setAttribute("data-bs-target", "#" + errorsId);
          const errorsContainer = subItem.querySelector('[name="content"]')
          errorsContainer.id = errorsId;
          const errorList = document.createElement("ul");
          errorList.className = "d-flex flex-column gap-3";
          errorsContainer.appendChild(errorList);
          for (let error of errors) {
            console.log(error)
            const errorDiv = document.createElement("li");
            const errorText = document.createElement("p");

            errorDiv.classList.add("row");
            error = error.replaceAll("\n", "\r\n")
            errorText.textContent = error
            errorText.classList.add("white-pre-line")
            errorDiv.appendChild(errorText)
            errorList.appendChild(errorDiv)
          }
          summaryElement.appendChild(subItem)
          contentElement.appendChild(htmlItem)
        }
        const container = document.createElement("div");
        container.appendChild(htmlBody)
        Swal.fire(
          {
            "icon": "info",
            "title": "Este es el resumen",
            "html": container.innerHTML,
          }
        )
      } catch (err) {
        console.error(err);
      }
    }).catch(err => {

      Swal.close();
      Swal.fire({
        icon: "error",
        text: "Error al importar reporte",
        footer: err.toString(),
      })
    })
  })
}
