
export default function getNumber(num: Number, specialHandling: boolean = false){
    if(num != null){
        return num.toLocaleString("de-DE", {
            minimumFractionDigits: 2
        });
    }else{
        if(specialHandling){
            return "0,00"
        }
    }
}