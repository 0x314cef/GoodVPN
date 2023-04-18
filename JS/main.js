//An index of pages
const pages = {
    page0: ["nfilter", "ckyman", "ctrlf", "nfilter", "mdown", "trans"],
    page1: ["vpn", "adblock", "js", "css", "settings", "search"], 
    page2: ["fp", "pemods", "pentest", "color"]
}
//Icon locations
const iconPos = [
    [30, 30],
    [30, 130],
    [130, 30],
    [130, 130],
    [230, 30],
    [230, 130]
]
//Root function running when the extension's window finishes loading
document.addEventListener("load", function() {
    console.log("Hello world")
    document.querySelectorAll(".navbtn").forEach(Btn => {
        console.log(Btn.id);
        var Button = document.getElementById(Btn.id);
        Button.addEventListener("click", function() {
            console.log("You clicked me!");
        });
    });
});