<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:include href="/XMII/CM/ApplicationLog/Transformations/IllumRowsetLibrary.xsl"/>
	<xsl:param name="SelectName"/>
	<xsl:param name="ListSize">1</xsl:param>
	<xsl:param name="MultiSelect">0</xsl:param>
	<xsl:param name="FirstLabel"></xsl:param>
	<xsl:param name="FirstValue"></xsl:param>
	<xsl:param name="ShowFirstLabel">1</xsl:param>
	<xsl:param name="Disabled">0</xsl:param>
	<xsl:param name="OnChange"/>
	<xsl:template match="/">
		<xsl:for-each select="Rowsets">
			<xsl:call-template name="PrintFatalError"/>
			<xsl:call-template name="PrintMessages"/>
			<xsl:for-each select="Rowset">
				<SELECT NAME="{$SelectName}" ID="{$SelectName}" SIZE="{$ListSize}">
					<xsl:if test="$Disabled = '1'">
						<xsl:attribute name="disabled">disabled</xsl:attribute>
					</xsl:if>
					<xsl:if test="$MultiSelect = '1'">
						<xsl:attribute name="MULTIPLE"/>
					</xsl:if>
					<xsl:if test="$OnChange != ''">
						<xsl:attribute name="ONCHANGE">
							<xsl:value-of select="$OnChange"/>
						</xsl:attribute>
					</xsl:if>
					<xsl:if test="$ShowFirstLabel = '1'">
						<OPTION value="{$FirstValue}"><xsl:value-of select="$FirstLabel"/></OPTION>
					</xsl:if>
					<xsl:for-each select="Row">
						<OPTION>
							<xsl:attribute name="VALUE">
								<xsl:value-of select="*[2]"/>
							</xsl:attribute>
							<xsl:value-of select="*[1]"/>
						</OPTION>
					</xsl:for-each>
				</SELECT>
			</xsl:for-each>
		</xsl:for-each>
	</xsl:template>
</xsl:stylesheet><!-- Stylesheet edited using Stylus Studio - (c)1998-2002 eXcelon Corp. -->