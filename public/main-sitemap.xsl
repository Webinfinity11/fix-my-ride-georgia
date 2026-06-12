<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                xmlns:html="http://www.w3.org/TR/REC-html40"
                exclude-result-prefixes="sitemap image html">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="ka">
      <head>
        <title>
          <xsl:choose>
            <xsl:when test="sitemap:sitemapindex">XML Sitemap Index - FixUp</xsl:when>
            <xsl:otherwise>XML Sitemap - FixUp</xsl:otherwise>
          </xsl:choose>
        </title>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex, follow"/>
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                         "Helvetica Neue", Arial, sans-serif;
            color: #333;
            margin: 0;
            background: #f5f7fa;
          }
          #description {
            background: #0E4780;
            color: #fff;
            padding: 28px 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          }
          #description h1 {
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: 600;
          }
          #description p {
            margin: 0;
            opacity: 0.9;
            font-size: 14px;
          }
          #description a {
            color: #fff;
            text-decoration: underline;
            font-weight: 500;
          }
          #description a:hover {
            opacity: 0.85;
          }
          #content {
            max-width: 1200px;
            margin: 30px auto;
            padding: 0 20px;
          }
          .meta {
            color: #666;
            font-size: 13px;
            margin-bottom: 14px;
          }
          .meta strong {
            color: #0E4780;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
            border-radius: 6px;
            overflow: hidden;
          }
          th {
            background: #0E4780;
            color: #fff;
            text-align: left;
            padding: 12px 16px;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }
          td {
            padding: 11px 16px;
            border-bottom: 1px solid #eef1f5;
            font-size: 14px;
            vertical-align: top;
          }
          tr:nth-child(even) td {
            background: #fafbfd;
          }
          tr:hover td {
            background: #f0f4fa;
          }
          td a {
            color: #B34A00;
            text-decoration: none;
            word-break: break-all;
          }
          td a:hover {
            text-decoration: underline;
          }
          .lastmod {
            white-space: nowrap;
            color: #666;
            font-size: 13px;
          }
          .images {
            text-align: center;
            color: #999;
            font-size: 13px;
          }
          .count {
            display: inline-block;
            background: #B34A00;
            color: #fff;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 12px;
            margin-left: 6px;
          }
          .footer {
            text-align: center;
            padding: 24px;
            color: #999;
            font-size: 12px;
          }
          .footer a {
            color: #0E4780;
            text-decoration: none;
          }
          @media (max-width: 600px) {
            #description { padding: 20px; }
            #description h1 { font-size: 20px; }
            #content { padding: 0 12px; }
            th, td { padding: 8px 10px; font-size: 12px; }
          }
        </style>
      </head>
      <body>
        <div id="description">
          <h1>
            <xsl:choose>
              <xsl:when test="sitemap:sitemapindex">XML Sitemap Index</xsl:when>
              <xsl:otherwise>XML Sitemap</xsl:otherwise>
            </xsl:choose>
          </h1>
          <p>
            <xsl:choose>
              <xsl:when test="sitemap:sitemapindex">
                მთავარი sitemap ინდექსი — ჩამოთვლის ყველა sub-sitemap-ს.
              </xsl:when>
              <xsl:otherwise>
                ეს sitemap შეიცავს URL მისამართებს, რომლებიც საძიებო სისტემებისთვისაა განკუთვნილი.
                <xsl:text> </xsl:text>
                <a href="/sitemap_index.xml">← Sitemap Index</a>
              </xsl:otherwise>
            </xsl:choose>
          </p>
        </div>

        <div id="content">
          <xsl:apply-templates/>
        </div>

        <div class="footer">
          Generated by <a href="https://fixup.ge">FixUp</a> — RankMath-style sitemap structure
        </div>
      </body>
    </html>
  </xsl:template>

  <!-- Sitemap Index view -->
  <xsl:template match="sitemap:sitemapindex">
    <p class="meta">
      ეს ინდექსი შეიცავს <strong><xsl:value-of select="count(sitemap:sitemap)"/></strong>
      sub-sitemap-ს.
    </p>
    <table>
      <thead>
        <tr>
          <th style="width: 75%">Sitemap</th>
          <th style="width: 25%">Last Modified</th>
        </tr>
      </thead>
      <tbody>
        <xsl:for-each select="sitemap:sitemap">
          <tr>
            <td>
              <a href="{sitemap:loc}">
                <xsl:value-of select="sitemap:loc"/>
              </a>
            </td>
            <td class="lastmod">
              <xsl:value-of select="sitemap:lastmod"/>
            </td>
          </tr>
        </xsl:for-each>
      </tbody>
    </table>
  </xsl:template>

  <!-- URL list view -->
  <xsl:template match="sitemap:urlset">
    <p class="meta">
      ეს sitemap შეიცავს <strong><xsl:value-of select="count(sitemap:url)"/></strong> URL მისამართს.
    </p>
    <table>
      <thead>
        <tr>
          <th style="width: 75%">URL</th>
          <th style="width: 5%">Images</th>
          <th style="width: 20%">Last Mod.</th>
        </tr>
      </thead>
      <tbody>
        <xsl:for-each select="sitemap:url">
          <tr>
            <td>
              <a href="{sitemap:loc}">
                <xsl:value-of select="sitemap:loc"/>
              </a>
            </td>
            <td class="images">
              <xsl:value-of select="count(image:image)"/>
            </td>
            <td class="lastmod">
              <xsl:value-of select="sitemap:lastmod"/>
            </td>
          </tr>
        </xsl:for-each>
      </tbody>
    </table>
  </xsl:template>

</xsl:stylesheet>
