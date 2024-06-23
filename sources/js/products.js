const newItemsPeriodDayLimit = 10;
const specialChars = /[`!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?~ ]/;

function replaceDiacritice(str) {
    const diacritice = {
        'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't',
        'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T'
    };
    
    return str.replace(/[ăâîșțĂÂÎȘȚ]/g, match => diacritice[match]);
}

window.addEventListener("load", () => {
    const filterBtn = document.getElementById("filterbtn");
    const resetBtn = document.getElementById("reset-btn");
    const calcBtn = document.getElementById("calc-btn");

    let products = document.getElementsByClassName("product");
    let initialProducts = Array.from(document.getElementsByClassName("product"));

    const priceRange = document.getElementById("price-inp");
    priceRange.onchange = function() {
        document.getElementById("rangevalue").innerHTML = `(${this.value})`;
    }

    const nameInput = document.getElementById("name-inp");
    nameInput.oninput = function() {
        if(specialChars.test(nameInput.value.toLowerCase().trim())) {
            nameInput.classList.add("is-invalid");
            document.getElementById("name-inp-label").innerHTML = "Input invalid";
        } 
        else {
            nameInput.classList.remove("is-invalid");
            document.getElementById("name-inp-label").innerHTML = "Numele produsului";
        }
    }

    filterBtn.onclick = function() {
        let shownprods = 0;
        let nameInputVal = replaceDiacritice(nameInput.value.toLowerCase().trim());
        let keywordInputVal = replaceDiacritice(document.getElementById("keywords-inp").value.toLowerCase().trim());
        let inpPriceVal = parseInt(priceRange.value);
        let inpBrandVal = replaceDiacritice(document.getElementById("brand-inp").value.toLowerCase().trim());
        let ageInputVal = document.getElementById("age-inp").value;
    
        let playerInputVal = document.getElementById("player-inp");
        let selectedValsMin = [];
        let selectedValsMax = [];
        let selectAll = false;
        for (let option of playerInputVal.selectedOptions) {
            if (option.value == "all") {
                selectAll = true;
                break;
            }
            selectedValsMin.push(option.value.split("-")[0]);
            selectedValsMax.push(option.value.split("-")[1]);
        }
        let minPlayersNr = Math.min(...selectedValsMin);
        let maxPlayersNr = Math.max(...selectedValsMax);
    
        let themeRadios = document.getElementsByName("theme-radio");
        let inpRadio;
        for (let radio of themeRadios) {
            if (radio.checked) {
                inpRadio = radio.value;
                break;
            }
        }
    
        let checkNewInp = document.getElementById("check-new").checked;
        let monthsRO = {
            "ianuarie": 1, "februarie": 2, "martie": 3, "aprilie": 4,
            "mai": 5, "iunie": 6, "iulie": 7, "august": 8,
            "septembrie": 9, "octombrie": 10, "noiembrie": 11, "decembrie": 12
        }
    
        let currDate = new Date();
    
        for (let product of products) {
            let nameVal = product.getElementsByClassName("nameval")[0].innerHTML.toLowerCase().trim();
            let keywords = product.getElementsByClassName("keywords")[0].innerHTML.toLowerCase().trim();
            let priceVal = parseFloat(product.getElementsByClassName("price")[0].innerHTML);
            let brandVal = product.getElementsByClassName("brand")[0].innerHTML.toLowerCase().trim();
            let themeVal = product.getElementsByClassName("theme")[0].innerHTML.trim();
            let ageVal = parseInt(product.getElementsByClassName("age")[0].innerHTML.trim());
            let playerMinVal = parseInt(product.getElementsByClassName("playermin")[0].innerHTML.trim());
            let playerMaxVal = parseInt(product.getElementsByClassName("playermax")[0].innerHTML.trim());
            let dateVal = product.getElementsByClassName("add-date")[0].innerHTML.toLowerCase().trim();
            let romanianDateParts = dateVal.split(",")[1].trim().split(" ");
            let day = parseInt(romanianDateParts[0]);
            let month = monthsRO[romanianDateParts[1]];
            let year = parseInt(romanianDateParts[2]);
            let isodate = new Date(year, month - 1, day);
    
            let cond1 = nameVal.startsWith(nameInputVal);
            let cond2 = keywords.includes(keywordInputVal);
            let cond3 = priceVal <= inpPriceVal;
            let cond4 = inpBrandVal ? (brandVal == inpBrandVal) : true;
            let cond5 = (inpRadio == "all") ? true : (inpRadio == themeVal);
            let cond6 = (ageInputVal == "all") ? true : (parseInt(ageInputVal) <= ageVal);
            let cond7 = selectAll || ((playerMinVal >= minPlayersNr) && (playerMaxVal <= maxPlayersNr));
            let cond8 = (!checkNewInp ? true : (Math.abs(currDate - isodate) / (1000 * 60 * 60 * 24)) <= newItemsPeriodDayLimit);
            let conditions = [cond1, cond2, cond3, cond4, cond5, cond6, cond7, cond8];
            if (conditions.every(condition => condition)) {
                product.style.display = "grid";
                shownprods++;
            } else {
                product.style.display = "none";
            }
        }
    
        const warnp = document.createElement("p");
        warnp.id = "warnp";
        const prodh2 = document.getElementById("prodh2");
        if (shownprods == 0) {
            warnp.innerHTML = "Nu exista niciun produs care satisface filtrele alese.";
            prodh2.insertAdjacentElement('afterend', warnp);
        } else {
            const existingWarnp = document.getElementById("warnp");
            if (existingWarnp) {
                existingWarnp.remove();
            }
        }
    };


    const sortBtnAsc = document.getElementById("sort-asc");
    const sortBtnDesc = document.getElementById("sort-desc");

    sortBtnAsc.onclick = function() {
        sortElems(1);
    }
    sortBtnDesc.onclick = function() {
        sortElems(-1);
    }

    function sortElems(order) {
        let productsArr = Array.from(products);
        productsArr.sort((a, b) => {
            let nameValA = a.getElementsByClassName("nameval")[0].innerHTML.toLowerCase().trim();
            let nameValB = b.getElementsByClassName("nameval")[0].innerHTML.toLowerCase().trim();
            if(nameValA.localeCompare(nameValB) == 0) {
                let priceValA = parseInt(a.getElementsByClassName("price")[0].innerHTML);
                let priceValB = parseInt(b.getElementsByClassName("price")[0].innerHTML);
                return order * (priceValA - priceValB);
            } else return order * nameValA.localeCompare(nameValB);
        });
        for(let product of productsArr) product.parentNode.appendChild(product);
    } 


    resetBtn.onclick = function() {
        if (confirm("Sunteti siguri ca vreti sa resetati toate filtrele?")) {
            document.getElementById("name-inp").value = "";
            document.getElementById("keywords-inp").value = "";
            priceRange.value = priceRange.max;
            document.getElementById("rangevalue").innerHTML = "(1000)";
            document.getElementById("brand-inp").value = "";
            document.getElementById("age-inp").selectedIndex = 0;
            document.getElementById("player-inp").selectedIndex = 0;
            document.getElementsByName("theme-radio")[0].checked = true;
            document.getElementById("check-new").checked = false;
            for (let product of initialProducts) {
                product.parentNode.appendChild(product);
                product.style.display = "grid";
            }
            const warnp = document.getElementById("warnp");
            if (warnp) warnp.remove();
        } else return;
    };
    
    calcBtn.onclick = function() {
        let totalPrice = 0;
        console.log("Displayul este:");
        for(let product of products) {
            console.log(product.style.display);
            if(product.style.display != "none") {
                let checkSelected = product.getElementsByClassName("cart-checkbox")[0].checked;
                if(checkSelected) totalPrice += parseFloat(product.getElementsByClassName("price")[0].innerHTML);
            }
        }
        if(totalPrice > 0) {
            const newDiv = document.createElement("div");
            newDiv.classList.add("calcdiv");
            const newP = document.createElement("p");
            newP.innerHTML = `Pretul total al produselor selectate este <span>${totalPrice}</span> RON.`;
            document.body.appendChild(newDiv);
            newDiv.appendChild(newP);
            setTimeout(() => {
                newDiv.remove();
            }, 2000);
        } else alert ("Niciun produs nu a fost selectat!");
    }
}); 

