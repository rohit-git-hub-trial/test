<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:java="http://xml.apache.org/xslt/java" exclude-result-prefixes="java">
	<xsl:include href="IllumRowsetLibrary.xsl"/>
	<xsl:param name="Language"/>
	<xsl:param name="DateFormat"></xsl:param>
	<xsl:param name="NumberFormat"></xsl:param>
	<xsl:template match="/">

<xsl:variable name="DS_MESSA_TITLE">
	<xsl:value-of select="/Rowsets/Rowset/Row/DS_MESSA_TITLE"/>
</xsl:variable>
<xsl:variable name="DS_MODUL">
	<xsl:value-of select="/Rowsets/Rowset/Row/DS_MODUL"/>
</xsl:variable>
<xsl:variable name="DT_MESSA">
	<xsl:choose><xsl:when test="/Rowsets/Rowset/Row/DT_MESSA = 'TimeUnavailable'"><xsl:value-of select="/Rowsets/Rowset/Row/DT_MESSA"/></xsl:when><xsl:otherwise>
	<xsl:value-of select="java:com.sap.xmii.Illuminator.ext.ExtFunctions.dateFromXMLFormat(/Rowsets/Rowset/Row/DT_MESSA,$DateFormat)"/></xsl:otherwise></xsl:choose>
</xsl:variable>
<xsl:variable name="CD_OBJEC">
	<xsl:value-of select="/Rowsets/Rowset/Row/CD_OBJEC"/>
</xsl:variable>
<xsl:variable name="DS_TRANS_NAME">
	<xsl:value-of select="/Rowsets/Rowset/Row/DS_TRANS_NAME"/>
</xsl:variable>
<xsl:variable name="DS_ACTIO_NAME">
	<xsl:value-of select="/Rowsets/Rowset/Row/DS_ACTIO_NAME"/>
</xsl:variable>

<div class="containerTitle"><xsl:value-of select="java:com.sap.xmii.Illuminator.localization.WebLocalizer.getLocalizedString('ApplicationLog', $Language, 'GENERAL_INFORMATION')" /></div>
<div class="containerBody">
<table class="objectForm">
    <tr>
      <td align="right"><xsl:value-of select="java:com.sap.xmii.Illuminator.localization.WebLocalizer.getLocalizedString('ApplicationLog', $Language, 'MESSAGE')" />:</td>
      <td colspan="5"><input type="text" id="DS_MESSA_TITLE" name="DS_MESSA_TITLE" value="{$DS_MESSA_TITLE}" size="122" maxlength="200" readonly="readonly" class="objectReadOnly" /></td>
    </tr>
    <tr>
      <td align="right" nowrap="nowrap"><xsl:value-of select="java:com.sap.xmii.Illuminator.localization.WebLocalizer.getLocalizedString('ApplicationLog', $Language, 'MII_TRANSACTION')" />:</td>
      <td colspan="5"><input type="text" id="DS_TRANS_NAME" name="DS_TRANS_NAME" value="{$DS_TRANS_NAME}" size="122" maxlength="200" readonly="readonly" class="objectReadOnly" /></td>
    </tr>
    <tr>
      <td align="right" nowrap="nowrap"><xsl:value-of select="java:com.sap.xmii.Illuminator.localization.WebLocalizer.getLocalizedString('ApplicationLog', $Language, 'MII_ACTION_BLOCK')" />:</td>
      <td colspan="5"><input type="text" id="DS_ACTIO_NAME" name="DS_ACTIO_NAME" value="{$DS_ACTIO_NAME}" size="122" maxlength="200" readonly="readonly" class="objectReadOnly" /></td>
    </tr>
    <tr>
      <td align="right"><xsl:value-of select="java:com.sap.xmii.Illuminator.localization.WebLocalizer.getLocalizedString('ApplicationLog', $Language, 'DATE')" />:</td>
      <td><input type="text" id="DT_MESSA" name="DT_MESSA" value="{$DT_MESSA}" size="20" maxlength="20" readonly="readonly" class="objectReadOnly" /></td>
      <td align="right"><xsl:value-of select="java:com.sap.xmii.Illuminator.localization.WebLocalizer.getLocalizedString('ApplicationLog', $Language, 'MODULE')" />:</td>
      <td><input type="text" id="DS_MODUL" name="DS_MODUL" value="{$DS_MODUL}" size="40" maxlength="100" readonly="readonly" class="objectReadOnly" /></td>
      <td align="right"><xsl:value-of select="java:com.sap.xmii.Illuminator.localization.WebLocalizer.getLocalizedString('ApplicationLog', $Language, 'OBJECT')" />:</td>
      <td><input type="text" id="CD_OBJEC" name="CD_OBJEC" value="{$CD_OBJEC}" size="29" maxlength="40" readonly="readonly" class="objectReadOnly" /></td>
    </tr>
  </table>
</div>

<div class="containerTitle"><xsl:value-of select="java:com.sap.xmii.Illuminator.localization.WebLocalizer.getLocalizedString('ApplicationLog', $Language, 'MESSAGE_DESCRIPTION')" />n</div>
<div class="containerBody">
<textarea style="width:777px;height:215px;" readonly="readyonly">
	<xsl:value-of select="/Rowsets/Rowset/Row/DS_MESSA_DESCR"/>
</textarea>
</div>

	</xsl:template>
</xsl:stylesheet>