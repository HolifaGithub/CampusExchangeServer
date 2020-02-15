interface StatusCodeList{
    success:200;
    fail:400;
    error:-1;
}
interface StatusList{
    success:'success',
    fail:'fail',
    error:'error'
}

const statusCodeList:StatusCodeList={
    success:200,
    fail:400,
    error:-1
}
const statusList:StatusList={
    success:'success',
    fail:'fail',
    error:'error'
}

export {
    statusCodeList,
    statusList,
}