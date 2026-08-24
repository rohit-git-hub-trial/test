try {
        $.post( "version.json?&__=" + Date.now()
            , function(data){
                (function() {

                    let sVersionURLParam = "";
                        sVersionURLParam = (data._enabled===true) ? "&_version=" + data._AppVersion : ""; 

                    let proxied = window.XMLHttpRequest.prototype.open;
                    window.XMLHttpRequest.prototype.open = function() {
                        if(arguments[1].indexOf("resources") == -1){
                            arguments[1] += ((arguments[1].indexOf("?") == -1) ? "?" : "") + sVersionURLParam;
                        }
                        return proxied.apply(this, [].slice.call(arguments));
                    };
                })();
                //new sap.ui.core.ComponentContainer({ name :  "sap.ui.demo.webapp" ,height : "100%"}).placeAt("content");
                
            }
            , 'json'
        ).error(function () {
            // in the MII env this would redirect to the main landing portal and force a login
            window.location = '/XMII?___=' + Date.now();
        });

} catch(err){
// in the MII env this would redirect to the main landing portal and force a login
window.location = '/XMII?___=' + Date.now();
}
