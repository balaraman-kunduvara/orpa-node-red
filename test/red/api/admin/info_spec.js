/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var should = require("should");
var request = require('supertest');
var express = require('express');
var sinon = require('sinon');
var when = require('when');

var app = express();
var info = require("../../../../red/api/admin/info");
var theme = require("../../../../red/api/editor/theme");

describe("api/admin/info", function() {
    describe("settings handler", function() {
        before(function() {
            sinon.stub(theme,"settings",function() { return { test: 456 };});
            app = express();
            app.get("/settings",info.settings);
        });

        after(function() {
            theme.settings.restore();
        });

        it('returns the filtered settings', function(done) {
            info.init({
                settings: {
                    foo: 123,
                    httpNodeRoot: "testHttpNodeRoot",
                    version: "testVersion",
                    paletteCategories :["red","blue","green"],
                    exportNodeSettings: function(obj) {
                        obj.testNodeSetting = "helloWorld";
                    }
                },
                nodes: {
                    paletteEditorEnabled: function() { return true; }
                }
            });
            request(app)
                .get("/settings")
                .expect(200)
                .end(function(err,res) {
                    if (err) {
                        return done(err);
                    }
                    res.body.should.have.property("httpNodeRoot","testHttpNodeRoot");
                    res.body.should.have.property("version","testVersion");
                    res.body.should.have.property("paletteCategories",["red","blue","green"]);
                    res.body.should.have.property("editorTheme",{test:456});
                    res.body.should.have.property("testNodeSetting","helloWorld");
                    res.body.should.not.have.property("foo",123);

                    done();
                });
        });
        it('overrides palette editable if runtime says it is disabled', function(done) {
            info.init({
                settings: {
                    httpNodeRoot: "testHttpNodeRoot",
                    version: "testVersion",
                    paletteCategories :["red","blue","green"],
                    exportNodeSettings: function() {}
                },
                nodes: {
                    paletteEditorEnabled: function() { return false; }
                }
            });
            request(app)
                .get("/settings")
                .expect(200)
                .end(function(err,res) {
                    if (err) {
                        return done(err);
                    }
                    res.body.should.have.property("httpNodeRoot","testHttpNodeRoot");
                    res.body.should.have.property("version","testVersion");
                    res.body.should.have.property("paletteCategories",["red","blue","green"]);
                    res.body.should.have.property("editorTheme");
                    res.body.editorTheme.should.have.property("test",456);

                    res.body.editorTheme.should.have.property("palette",{editable:false});
                    done();
                });
        })
    });

});
