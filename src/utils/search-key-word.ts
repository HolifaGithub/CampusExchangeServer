function SearchKeyWord(handleValue, typeOneNameArray, typeTwoNameArray, typeThreeNameArray, nameInputArrayArray, searchStart) {
    if (searchStart == 'typeOne') {
        for (let i of typeOneNameArray) {
            const handleI = i.replace(/\s*/g, "")
            let reg = new RegExp(`^${handleI}$`, 'ig')
            let result = reg.test(handleValue)
            if (result) {
                return { value: i, col: 'type_one' }
            }
        }
    } else if (searchStart === 'typeThree') {
        for (let j of typeThreeNameArray) {
            const handleJ = j.replace(/\s*/g, "")
            let reg = new RegExp(`^${handleJ}$`, 'ig')
            let result = reg.test(handleValue)
            if (result) {
                return { value: j, col: 'type_three' }
            }
        }
    }
    else if (searchStart == 'nameInput') {
        for (let z of nameInputArrayArray) {
            const handleZ = z.replace(/\s*/g, "")
            let reg = new RegExp(`^(\w*)${handleZ}(\w*)$`, 'ig')
            let result = reg.test(handleValue)
            if (result) {
                return { value: z, col: 'name_input' }
            }
        }
        for (let k of typeThreeNameArray) {
            const handleK = k.replace(/\s*/g, "")
            let reg = new RegExp(`(\w*)${handleK}(\w*)`, 'ig')
            let result = reg.test(handleValue)
            if (result) {
                return { value: k, col: 'type_three' }
            }
        }
        for (let j of typeTwoNameArray) {
            const handleJ = j.replace(/\s*/g, "")
            let reg = new RegExp(`(\w*)${handleJ}(\w*)`, 'ig')
            let result = reg.test(handleValue)
            if (result) {
                return { value: j, col: 'type_two' }
            }
        }
        for (let i of typeOneNameArray) {
            const handleI = i.replace(/\s*/g, "")
            let reg = new RegExp(`(\w*)${handleI}(\w*)`, 'ig')
            let result = reg.test(handleValue)
            if (result) {
                return { value: i, col: 'type_one' }
            }
        }
    }
    return false
}

export default SearchKeyWord