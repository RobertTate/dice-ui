import './displayResults.css'

const checkIcon = `
<svg class="success" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<title>checkmark</title>
<path id="checkmark" d="M16 3c-7.18 0-13 5.82-13 13s5.82 13 13 13 13-5.82 13-13-5.82-13-13-13zM23.258 12.307l-9.486 9.485c-0.238 0.237-0.623 0.237-0.861 0l-0.191-0.191-0.001 0.001-5.219-5.256c-0.238-0.238-0.238-0.624 0-0.862l1.294-1.293c0.238-0.238 0.624-0.238 0.862 0l3.689 3.716 7.756-7.756c0.238-0.238 0.624-0.238 0.862 0l1.294 1.294c0.239 0.237 0.239 0.623 0.001 0.862z"></path>
</svg>
`

const cancelIcon = `
<svg class="failure" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<title>cancel</title>
<path id="cancel" d="M16 29c-7.18 0-13-5.82-13-13s5.82-13 13-13 13 5.82 13 13-5.82 13-13 13zM21.961 12.209c0.244-0.244 0.244-0.641 0-0.885l-1.328-1.327c-0.244-0.244-0.641-0.244-0.885 0l-3.761 3.761-3.761-3.761c-0.244-0.244-0.641-0.244-0.885 0l-1.328 1.327c-0.244 0.244-0.244 0.641 0 0.885l3.762 3.762-3.762 3.76c-0.244 0.244-0.244 0.641 0 0.885l1.328 1.328c0.244 0.244 0.641 0.244 0.885 0l3.761-3.762 3.761 3.762c0.244 0.244 0.641 0.244 0.885 0l1.328-1.328c0.244-0.244 0.244-0.641 0-0.885l-3.762-3.76 3.762-3.762z"></path>
</svg>
`

class DisplayResults {
	constructor(selector) {
		this.target = document.querySelector(selector) || document.body
		this.timeout = 500
		this.elem = document.createElement('div');
		this.elem.className = 'displayResults'
		this.resultsElem1 = document.createElement('div')
		this.resultsElem1.className = 'results hidden'
		this.resultsElem1.style.transition = `all ${this.timeout}ms`
		this.resultsElem2 = document.createElement('div')
		this.resultsElem2.className = 'results hidden'
		this.resultsElem2.style.transition = `all ${this.timeout}ms`
		this.init()
	}

	async init(){
		this.elem.append(this.resultsElem1)
		this.elem.append(this.resultsElem2)
		this.target.prepend(this.elem)
		this.resultsElem1.addEventListener('click', () => this.clear())
		this.resultsElem2.addEventListener('click', () => this.clear())
		this.even = false
	}

	showResults(data, parsedNotationForMods){
		this.clear(this[`resultsElem${this.even ? 1 : 2}`])
		let rolls
		if(data.rolls && !Array.isArray(data.rolls)){
			rolls = Object.values(data.rolls).map(roll => roll)
		} else {
			rolls = Object.values(this.recursiveSearch(data,'rolls')).map(group => {
				return Object.values(group)
			}).flat()
		}

		let total = 0
		if(data.hasOwnProperty('value')) {
			if (data?.rolls?.length === 1) {
				total = data?.rolls?.[0]?.roll;
			} else {
				total = data.value
			}
		} else { 
			total = rolls.reduce((val,roll) => val + roll.value,0)
			let modifier = data.reduce((val,roll) => val + roll.modifier,0)
			total += modifier
		}

		const modSearch = (obj, searchKey, results = []) => {
			const r = results;
			Object.keys(obj).forEach(key => {
				const value = obj[key];
				if(key === searchKey) {
					value.forEach((val) => {
						if (val.tail.type === "number") {
							r.push(val);
						} else {
							modSearch(val, searchKey, r);
						}
					});
				} else if(value && typeof value === 'object'){
					modSearch(value, searchKey, r);
				}
			});
			return r;
		}

		const modsArray = modSearch(parsedNotationForMods, "ops").flat().filter((mod) => mod?.tail?.type === "number");

		total = isNaN(total) ? '...' : total

		if(typeof total === 'string'){
			const counter = {}
			
			// count up values
			function logValue(value) {
				if(value && typeof value === 'string'){
					if(counter[value]){
						counter[value] = counter[value] + 1
					} else {
						counter[value] = 1
					}
				}
			}
			rolls.forEach(roll => {
				// if value is a string
				if(typeof roll.value === 'string'){
					logValue(roll.value)
				}

				// if value is an array, then loop and count
				if(Array.isArray(roll.value)){
					roll.value.forEach(val => {
						logValue(val)
					})
				}
			})

			// clear total
			total = ''

			// sort the keys by alpha
			const sortedCounter = Object.fromEntries(Object.entries(counter).sort())

			// build the result
			Object.entries(sortedCounter).forEach(([key,val],i) => {
				if(i!==0){
					total += ', '
				}
				total += key + ": " + val
			})

		}


		let resultString = ''

		rolls.forEach((roll,i) => {
			let val
			let sides = roll.die || roll.sides || 'fate'

			if(i !== 0 && resultString.length) {
				if(typeof roll.value !== 'undefined' && (roll.value.length || typeof roll.value === 'number')) {
					resultString += ', '
				}
			}

			if(roll.success !== undefined && roll.success !== null){
				val = roll.success ? checkIcon : cancelIcon;
			} else {
				// convert to string in case value is 0 which would be evaluated as falsy
				val = roll.hasOwnProperty('value') ? roll.value.toString() : '...'
				// space comma separated values from arrays
				if(val.includes(',')){
					val = val.replace(',', ', ')
				}
			}

			let classes = `d${sides}`

			if(roll.critical === "success" || (roll.hasOwnProperty('value') && sides == roll.value)) {
				classes += ' crit-success'
			}
			if(roll.critical === "failure" || (roll.success === null && roll.hasOwnProperty('value') && roll.value <= 1 && sides !== 'fate')) {
				classes += ' crit-failure'
			}
			if(roll.drop) {
				classes += ' die-dropped'
			}
			if(roll.reroll) {
				classes += ' die-rerolled'
			}
			if(roll.explode) {
				classes += ' die-exploded'
			}
			if(sides === 'fate'){
				if(roll.value === 1){
					classes += ' crit-success'
				}
				if(roll.value === -1){
					classes += ' crit-failure'
				}
			}

			if(val && classes !== ''){
				val = `<span class='${classes.trim()}'>${val}</span>`
			}

			resultString += val

			if (modsArray[i]) {
				const modifier = modsArray[i];
				const value = modifier?.tail?.value;
				const modMap = {
					"+": `<span class="mod-positive">+${value}</span>`,
					"-": `<span class="mod-negative">-${value}</span>`,
					"*": `<span class="mod-multiply">*${value}</span>`,
					"/": `<span class="mod-divide">/${value}</span>`
				};
				resultString += modMap?.[modifier?.op] || '';
			}
		})

		let isSuccess;
		if (rolls?.length === 1) {
			const singleRoll = rolls?.[0];
			isSuccess = singleRoll?.success;
		}

		resultString += (isSuccess === null || isSuccess === undefined) ? 
			` = <strong>${total}</strong>` :
			` = <strong data-success=${isSuccess}>${total}</strong>`


		if (data.label && typeof data.label === "string" && data.label.includes("#")){
			const labelToAdd = data.label.split("#")[1];
			if (labelToAdd) {
				resultString += `<span class="dice-result-label">${labelToAdd}</span>`
			}
		}

		const currentElem = this[`resultsElem${this.even ? 2 : 1}`]
		currentElem.innerHTML = resultString
		// this.resultsElem.classList.remove('hideEffect')
		clearTimeout(currentElem.hideTimer)
		currentElem.classList.add('showEffect')
		currentElem.classList.remove('hidden')
		currentElem.classList.remove('hideEffect')
		this.even = !this.even

	}
	clear(elem){
		const currentElem = elem || this[`resultsElem${this.even ? 1 : 2}`]
		currentElem.classList.replace('showEffect','hideEffect')
		this.even = !this.even
		currentElem.hideTimer = setTimeout(()=>currentElem.classList.replace('hideEffect', 'hidden'),this.timeout)
	}
	// make this static for use by other systems?
	recursiveSearch(obj, searchKey, results = [], callback) {
		const r = results;
		Object.keys(obj).forEach(key => {
			const value = obj[key];
			// if(key === searchKey && typeof value !== 'object'){
			if(key === searchKey){
				r.push(value);
				if(callback && typeof callback === 'function') {
					callback(obj)
				}
			} else if(value && typeof value === 'object'){
				this.recursiveSearch(value, searchKey, r, callback);
			}
		});
		return r;
	}
}

export default DisplayResults
