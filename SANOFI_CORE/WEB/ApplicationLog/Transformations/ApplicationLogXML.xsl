<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:java="http://xml.apache.org/xslt/java" exclude-result-prefixes="java">
	<xsl:include href="IllumRowsetLibrary.xsl"/>
	<xsl:param name="DateFormat"></xsl:param>
	<xsl:param name="NumberFormat"></xsl:param>
	<xsl:template match="/">

	<xsl:value-of select="/Rowsets/Rowset/Row/*[1]"/>

	</xsl:template>
</xsl:stylesheet>