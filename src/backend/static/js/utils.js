//Esta clase es utilizada para evitar repetir la misma declaración fetch
class Fetcher{
    base_url = ""
    csrfToken = ""
    constructor(base_url, csrfToken=""){
        this.base_url = base_url
        this.csrfToken = csrfToken
        this.getFetcher = this.getFetcher.bind(this)
        this.fetch = this.fetch.bind(this)
    }

    setBaseUrl(new_base_url){
        this.base_url = new_base_url
        return this
    }
    getFetcher(){
   
        return this.fetch
    }
    fetch(params={}){
   
        const {method="GET", url="", body={}} = params
        const fetchConfig = {
            method,
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": this.csrfToken,
            },
            cache: "no-cache",
            credentials: "same-origin",
            }
        if(body && method != "GET"){
            fetchConfig["body"] = body
        }
        return fetch(this.base_url + url, fetchConfig 
        )
    }
}

function getCsrf(){
    const csrfToken = $("[name=csrfmiddlewaretoken]").val();
    return csrfToken
}




const Success = Swal.mixin({
    icon: "success"
})

const Err = Swal.mixin({
    icon: "error"
})

const Warning = Swal.mixin({
    icon: "warning"
})


 