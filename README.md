# Update Course Action

This GitHub Action can be used to upload course content to a course in a Brightspace LMS. A manifest.json file must be provided to identify the order and structure of content files to be uploaded.

## Quick start

Sample workflow:

```
name: Upload to course
on:
  push:
    branches:
      - master
  pull_request:
jobs:
  update_course_content:
    name: Upload files to the course
    runs-on: ubuntu-latest
    steps:
      - uses: Brightspace/third-party-actions@actions/checkout
      - name: Upload to Course
        uses: Brightspace/update-course-action@master
        with:
          valenceAppId: ${{ secrets.VALENCE_APPID }}
          valenceAppKey: ${{ secrets.VALENCE_APPKEY }}
          valenceUserId: ${{ secrets.VALENCE_USERID }}
          valenceUserKey: ${{ secrets.VALENCE_USERKEY }}
          instanceDomain: yourdomain.lms.brightspace.com
          courseOrgUnitId: 123456
          contentDirectory: content
          manifestPath: content/manifest.json
          dryRun: ${{ github.ref != 'refs/heads/master' }}
```

Sample manifest.json file:
```
{
  "$schema": "https://raw.githubusercontent.com/Brightspace/update-course-action/master/manifest_schema_v1_0.json",
  "modules": [
    {
      "title": "Sample Module",
      "type": "module",
      "descriptionFileName": "sample/desciption.md",
      "dueDate": "2020-01-01T00:00:00.000Z",
      "children": [
        {
          "type": "resource",
          "fileName": "sample/CourseComplete.png"
        },
        {
          "title": "Topic One",
          "type": "topic",
          "fileName": "sample/topic-one.md"
        }
      ]
    }
  ]
}
```

NOTE: Any *.md files referenced in the manifest will be rendered to HTML before being uploaded to the course.

## Documentation

The schema for the manifest.json is specified in [manifest_schema_v1_0.json](manifest_schema_v1_0.json)

