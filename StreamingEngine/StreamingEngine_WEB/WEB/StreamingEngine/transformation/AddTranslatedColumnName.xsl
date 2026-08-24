<?xml version='1.0' encoding="iso-8859-1"?>  
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" >   
<xsl:output encoding="UTF-8" method="xml" media-type="text/xml"/>
<xsl:template match="/">  
	<Rowsets DateCreated="{Rowsets/@DateCreated}" Version="{Rowsets/@Version}" StartDate="{Rowsets/@StartDate}" EndDate="{Rowsets/@EndDate}">
		<xsl:for-each select="Rowsets">
			<xsl:copy-of select="FatalError"/>
			<xsl:copy-of select="Messages"/>
			<xsl:copy-of select="HyperLinks"/>
			<xsl:if test="count(/Rowsets/FatalError) = '0'">
			<Rowset>
				<Columns>
				<xsl:for-each select="Rowset/Columns/Column">
					<xsl:copy-of select="."/>
				</xsl:for-each>				
				<Column Description="FileNameEnc" MaxRange="0" MinRange="0" Name="FileNameEnc" SQLDataType="93" SourceColumn="FileNameEnc"/>
				</Columns>
				<xsl:for-each select="Rowset/Row">
					<Row>
					<xsl:for-each select="*">
						<xsl:variable name="RowCoNo" select="position()"/>
						<xsl:copy-of select="."/>
						<xsl:if test="$RowCoNo = 4">
						<FileNameEnc><xsl:value-of select="java:com.sap.lhcommon.common.LHUtilFunctions.xmlEncodeName(string(.))"/></FileNameEnc>
						</xsl:if>
					</xsl:for-each>
					</Row>
				</xsl:for-each>
			</Rowset>
			</xsl:if>
		</xsl:for-each>
	</Rowsets>
</xsl:template>
</xsl:stylesheet>
