
export default function getNumber(num: Number){
    if(num != null){
        return num.toLocaleString("de-DE", {
            minimumFractionDigits: 2
        });
    }
}