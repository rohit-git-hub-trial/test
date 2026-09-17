var nullstring = "---";
var nullnumber = "NA";
var nulldate = "TimeUnavailable";


function openTab(id) {
	for(var i=1; document.getElementById("tab_cel_"+i)!=null; i++) {
		if(i==1) document.getElementById("tab_img_"+i).background = "Images/tab_ini_off.gif";
		else document.getElementById("tab_img_"+i).background = "Images/tab_int_off.gif";
		if(document.getElementById("tab_cel_"+(i+1))==null) document.getElementById("tab_img_"+(i+1)).background = "Images/tab_fim_off.gif";					
		document.getElementById("tab_cel_"+i).background = "Images/tab_fun_off.gif";
		document.getElementById("tab_cel_"+i).style.color = "#666666";	
		document.getElementById("tab_cel_"+i).style.fontWeight = "normal";		
		if(document.getElementById("tab_"+i)) document.getElementById("tab_"+i).style.display = 'none';
	}
	if(id>0) {
		if(id==1) document.getElementById("tab_img_"+id).background = "Images/tab_ini_on.gif";
		else document.getElementById("tab_img_"+id).background = "Images/tab_int_on.gif";
		if(id==(i-1)) document.getElementById("tab_img_"+(id+1)).background = "Images/tab_fim_on.gif";				
		else document.getElementById("tab_img_"+(id+1)).background = "Images/tab_pos_on.gif";				
		document.getElementById("tab_cel_"+id).background = "Images/tab_fun_on.gif";	
		document.getElementById("tab_cel_"+id).style.color = "#000000";	
		document.getElementById("tab_cel_"+id).style.fontWeight = "bold";
		if(document.getElementById("tab_"+id)) document.getElementById("tab_"+id).style.display = '';	
	}
}

function IsNumeric(sText)
{
   var ValidChars = "0123456789.";
   var IsNumber=true;
   var Char;

 
   for (i = 0; i < sText.length && IsNumber == true; i++) 
      { 
      Char = sText.charAt(i); 
      if (ValidChars.indexOf(Char) == -1) 
         {
         IsNumber = false;
         }
      }
   return IsNumber;
   
   }
function formatNumberToSQL(Value, DecimalDelimiter) {
	var Aux = Value;
	if(DecimalDelimiter.replace(/\ /gi, "")==",") {
		Aux =Aux.replace(/\./gi, "");
		Aux =Aux.replace(/\,/gi, ".");
	}
	else {
		Aux =Aux.replace(/\,/gi, "");
	}
	return Aux;
}

function formatNumber(n, len) {  
	var s = n.toString();  
	if (s.length < len) {  
		s = ('00000000000000000000' + s).slice(-len);  
	}  
	return s;  
}


function replaceArray(arrayName,replaceTo, replaceWith){
	for(var i=0; i<arrayName.length;i++ ) if(arrayName[i]==replaceTo) arrayName.splice(i,1,replaceWith);          
	return arrayName;
} 


function distinctArray(arrayName) {
	var newArray=new Array();
	label:for(var i=0; i<arrayName.length;i++ ) {  
		for(var j=0; j<newArray.length;j++ ) if(newArray[j]==arrayName[i]) continue label;
            	newArray[newArray.length] = arrayName[i];
	}
	return newArray;
}