---
identifier: test-image-name-local
tags:
    - test
    - image
---

> This is for the S3 link plugin testing. In this test we specifically test what kind of characters are allowed for objectKeys in AWS S3.

> [!Info]
> Some of the Test examples are intended to fail to demonstrate what works and what doesn't. Tests that are expected to fail are clearly marked.

### HTML Embed

#### HTML Embed Spaces

> [!Check] Expected to Work

<img src="s3:images/s3 image html embed test jpg space.jpg" />

#### HTML Embed Special Characters

> [!Check] Expected to Work

<img src="s3:images/s3_image_html_embed_test_jpg_special_characters_!@#$%^&()-_+={}[]~'.jpg" />

#### HTML Embed Underscore

> [!Check] Expected to Work

<img src="s3:images/s3_image_html_embed_test_jpg_underscore.jpg" />

#### HTML Embed Hyphen

> [!Check] Expected to Work

<img src="s3:images/s3-image-html-embed-test-jpg-hyphen.jpg" />

#### HTML Embed Upper Lower Case

> [!Check] Expected to Work

<img src="s3:images/s3_Image_Html_Embed_Test_jpg_Upper_Lower_Case.jpg" />

### Obsidian Image Embed

#### Obsidian Image Embed Spaces

> [!Fail] Expected to Fail

![](s3:images/s3 image obsidian image embed test jpg space.jpg)

#### Obsidian Image Embed Special Characters

> [!Fail] Expected to Fail

> [!Warning] 
> This is caused by a double encoding of the value and will show up in the Javascript console and the network log as "UnkownError". The file cannot be found in the S3 Bucket.

![](s3:images/s3_image_obsidian_image_embed_test_jpg_special_characters_!@#$%^&()-_+={}[]~'.jpg)

#### Obsidian Image Embed Underscore

> [!Check] Expected to Work

![](s3:images/s3_image_obsidian_image_embed_test_jpg_underscore.jpg)

#### Obsidian Image Embed Hyphen

> [!Check] Expected to Work

![](s3:images/s3-image-obsidian-image-embed-test-jpg-hyphen.jpg)

#### Obsidian Image Embed Upper Lower Case

> [!Check] Expected to Work

![](s3:images/s3_Image_Obsidian_Image_Embed_Test_jpg_Upper_Lower_Case.jpg)

### Obsidian File Embed

#### Obsidian File Embed Spaces

> [!Check] Expected to Work

![[s3:images/s3 image obsidian file embed test jpg space.jpg]]

#### Obsidian File Embed Special Characters

> [!Check] Expected to Work

![[s3:images/s3_file_obsidian_image_embed_test_jpg_special_characters_!@#$%^&()-_+={}[]~'.jpg]]

#### Obsidian File Embed Underscore

> [!Check] Expected to Work

![[s3:images/s3_image_obsidian_file_embed_test_jpg_underscore.jpg]]

#### Obsidian File Embed Hyphen

> [!Check] Expected to Work

![[s3:images/s3-image-obsidian-file-embed-test-jpg-hyphen.jpg]]

#### Obsidian File Embed Upper Lower Case

> [!Check] Expected to Work

![[s3:images/s3_Image_Obsidian_File_Embed_Test_jpg_Upper_Lower_Case.jpg]]