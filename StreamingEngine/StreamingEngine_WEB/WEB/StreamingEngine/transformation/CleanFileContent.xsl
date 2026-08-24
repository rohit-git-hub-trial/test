<?xml version='1.0' encoding="iso-8859-1"?>  
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" >   
<xsl:output encoding="UTF-8" method="xml" media-type="text/xml"/>
<xsl:param name="StartDate" />
<xsl:param name="EndDate" />
<xsl:template match="/">  
	<Rowsets DateCreated="{Rowsets/@DateCreated}" Version="{Rowsets/@Version}" StartDate="{Rowsets/@StartDate}" EndDate="{Rowsets/@EndDate}">
		<xsl:for-each select="Rowsets">
			<xsl:copy-of select="FatalError"/>
			<xsl:copy-of select="Messages"/>
			<xsl:copy-of select="HyperLinks"/>
			<xsl:if test="count(/Rowsets/FatalError) = '0'">
			<Rowset>
				<Columns>
			<Column Description="FileName" MaxRange="0" MinRange="0" Name="FileName" SQLDataType="93" SourceColumn="FileName"/>
			<Column Description="FileCreationDateUTC" MaxRange="0" MinRange="0" Name="FileCreationDateUTC" SQLDataType="93" SourceColumn="FileCreationDateUTC"/>
			<Column Description="SD" MaxRange="0" MinRange="0" Name="SD" SQLDataType="93" SourceColumn="SD"/>
			<Column Description="ED" MaxRange="0" MinRange="0" Name="ED" SQLDataType="93" SourceColumn="ED"/>
				</Columns>
				<xsl:for-each select="Rowset/Row">
					<xsl:variable name="dtRow" select="*[3]/."/>
					<Row desc="{$dtRow}">
					<xsl:for-each select="*">
						<xsl:variable name="RowCoNo" select="position()"/>
						<xsl:if test="$RowCoNo = 2">
							<FileName><xsl:value-of select="name(.)"/></FileName>
						</xsl:if>
						<xsl:if test="$RowCoNo = 3">
							<FileCreationDateUTC><xsl:value-of select="."/></FileCreationDateUTC>
							<SD><xsl:value-of select="$StartDate"/></SD>
							<ED><xsl:value-of select="$EndDate"/></ED>
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
