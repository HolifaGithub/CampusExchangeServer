function SearchKeyWord(valueArray, typeOneNameArray, typeTwoNameArray, typeThreeNameArray, nameInputArrayArray,searchStart) {
    for (let word of valueArray) {
        if(searchStart=='typeOne'||searchStart==='typeThree'){
            for (let i of typeOneNameArray) {
                let reg = new RegExp(`(\w*)${i}(\w*)`, 'ig')
                let result = reg.test(word)
                if (result) {
                    return {value:i,col:'type_one'}
                }
            }
            for (let j of typeTwoNameArray) {
                let reg = new RegExp(`(\w*)${j}(\w*)`, 'ig')
                let result = reg.test(word)
                if (result) {
                    return {value:j,col:'type_two'}
                }
            }

            for (let k of typeThreeNameArray) {
                let reg = new RegExp(`(\w*)${k}(\w*)`, 'ig')
                let result = reg.test(word)
                if (result) {
                    return {value:k,col:'type_three'}
                }
            }

            for (let z of nameInputArrayArray) {
                let reg = new RegExp(`^(\w*)${z}(\w*)$`, 'ig')
                let result = reg.test(word)
                if (result) {
                    return {value:z,col:'name_input'}
                }
            }
        }else if (searchStart=='nameInput'){
            for (let z of nameInputArrayArray) {
                let reg = new RegExp(`^(\w*)${z}(\w*)$`, 'ig')
                let result = reg.test(word)
                if (result) {
                    return {value:z,col:'name_input'}
                }
            }
            for (let k of typeThreeNameArray) {
                let reg = new RegExp(`(\w*)${k}(\w*)`, 'ig')
                let result = reg.test(word)
                if (result) {
                    return {value:k,col:'type_three'}
                }
            }
            for (let j of typeTwoNameArray) {
                let reg = new RegExp(`(\w*)${j}(\w*)`, 'ig')
                let result = reg.test(word)
                if (result) {
                    return {value:j,col:'type_two'}
                }
            }
            for (let i of typeOneNameArray) {
                let reg = new RegExp(`(\w*)${i}(\w*)`, 'ig')
                let result = reg.test(word)
                if (result) {
                    return {value:i,col:'type_one'}
                }
            }
        }
    }

    return false
}

export default SearchKeyWord