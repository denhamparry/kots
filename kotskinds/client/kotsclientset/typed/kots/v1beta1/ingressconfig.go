/*
Copyright 2019 Replicated, Inc..

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
// Code generated by client-gen. DO NOT EDIT.

package v1beta1

import (
	"context"
	"time"

	v1beta1 "github.com/replicatedhq/kots/kotskinds/apis/kots/v1beta1"
	scheme "github.com/replicatedhq/kots/kotskinds/client/kotsclientset/scheme"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	types "k8s.io/apimachinery/pkg/types"
	watch "k8s.io/apimachinery/pkg/watch"
	rest "k8s.io/client-go/rest"
)

// IngressConfigsGetter has a method to return a IngressConfigInterface.
// A group's client should implement this interface.
type IngressConfigsGetter interface {
	IngressConfigs(namespace string) IngressConfigInterface
}

// IngressConfigInterface has methods to work with IngressConfig resources.
type IngressConfigInterface interface {
	Create(ctx context.Context, ingressConfig *v1beta1.IngressConfig, opts v1.CreateOptions) (*v1beta1.IngressConfig, error)
	Update(ctx context.Context, ingressConfig *v1beta1.IngressConfig, opts v1.UpdateOptions) (*v1beta1.IngressConfig, error)
	UpdateStatus(ctx context.Context, ingressConfig *v1beta1.IngressConfig, opts v1.UpdateOptions) (*v1beta1.IngressConfig, error)
	Delete(ctx context.Context, name string, opts v1.DeleteOptions) error
	DeleteCollection(ctx context.Context, opts v1.DeleteOptions, listOpts v1.ListOptions) error
	Get(ctx context.Context, name string, opts v1.GetOptions) (*v1beta1.IngressConfig, error)
	List(ctx context.Context, opts v1.ListOptions) (*v1beta1.IngressConfigList, error)
	Watch(ctx context.Context, opts v1.ListOptions) (watch.Interface, error)
	Patch(ctx context.Context, name string, pt types.PatchType, data []byte, opts v1.PatchOptions, subresources ...string) (result *v1beta1.IngressConfig, err error)
	IngressConfigExpansion
}

// ingressConfigs implements IngressConfigInterface
type ingressConfigs struct {
	client rest.Interface
	ns     string
}

// newIngressConfigs returns a IngressConfigs
func newIngressConfigs(c *KotsV1beta1Client, namespace string) *ingressConfigs {
	return &ingressConfigs{
		client: c.RESTClient(),
		ns:     namespace,
	}
}

// Get takes name of the ingressConfig, and returns the corresponding ingressConfig object, and an error if there is any.
func (c *ingressConfigs) Get(ctx context.Context, name string, options v1.GetOptions) (result *v1beta1.IngressConfig, err error) {
	result = &v1beta1.IngressConfig{}
	err = c.client.Get().
		Namespace(c.ns).
		Resource("ingressconfigs").
		Name(name).
		VersionedParams(&options, scheme.ParameterCodec).
		Do(ctx).
		Into(result)
	return
}

// List takes label and field selectors, and returns the list of IngressConfigs that match those selectors.
func (c *ingressConfigs) List(ctx context.Context, opts v1.ListOptions) (result *v1beta1.IngressConfigList, err error) {
	var timeout time.Duration
	if opts.TimeoutSeconds != nil {
		timeout = time.Duration(*opts.TimeoutSeconds) * time.Second
	}
	result = &v1beta1.IngressConfigList{}
	err = c.client.Get().
		Namespace(c.ns).
		Resource("ingressconfigs").
		VersionedParams(&opts, scheme.ParameterCodec).
		Timeout(timeout).
		Do(ctx).
		Into(result)
	return
}

// Watch returns a watch.Interface that watches the requested ingressConfigs.
func (c *ingressConfigs) Watch(ctx context.Context, opts v1.ListOptions) (watch.Interface, error) {
	var timeout time.Duration
	if opts.TimeoutSeconds != nil {
		timeout = time.Duration(*opts.TimeoutSeconds) * time.Second
	}
	opts.Watch = true
	return c.client.Get().
		Namespace(c.ns).
		Resource("ingressconfigs").
		VersionedParams(&opts, scheme.ParameterCodec).
		Timeout(timeout).
		Watch(ctx)
}

// Create takes the representation of a ingressConfig and creates it.  Returns the server's representation of the ingressConfig, and an error, if there is any.
func (c *ingressConfigs) Create(ctx context.Context, ingressConfig *v1beta1.IngressConfig, opts v1.CreateOptions) (result *v1beta1.IngressConfig, err error) {
	result = &v1beta1.IngressConfig{}
	err = c.client.Post().
		Namespace(c.ns).
		Resource("ingressconfigs").
		VersionedParams(&opts, scheme.ParameterCodec).
		Body(ingressConfig).
		Do(ctx).
		Into(result)
	return
}

// Update takes the representation of a ingressConfig and updates it. Returns the server's representation of the ingressConfig, and an error, if there is any.
func (c *ingressConfigs) Update(ctx context.Context, ingressConfig *v1beta1.IngressConfig, opts v1.UpdateOptions) (result *v1beta1.IngressConfig, err error) {
	result = &v1beta1.IngressConfig{}
	err = c.client.Put().
		Namespace(c.ns).
		Resource("ingressconfigs").
		Name(ingressConfig.Name).
		VersionedParams(&opts, scheme.ParameterCodec).
		Body(ingressConfig).
		Do(ctx).
		Into(result)
	return
}

// UpdateStatus was generated because the type contains a Status member.
// Add a +genclient:noStatus comment above the type to avoid generating UpdateStatus().
func (c *ingressConfigs) UpdateStatus(ctx context.Context, ingressConfig *v1beta1.IngressConfig, opts v1.UpdateOptions) (result *v1beta1.IngressConfig, err error) {
	result = &v1beta1.IngressConfig{}
	err = c.client.Put().
		Namespace(c.ns).
		Resource("ingressconfigs").
		Name(ingressConfig.Name).
		SubResource("status").
		VersionedParams(&opts, scheme.ParameterCodec).
		Body(ingressConfig).
		Do(ctx).
		Into(result)
	return
}

// Delete takes name of the ingressConfig and deletes it. Returns an error if one occurs.
func (c *ingressConfigs) Delete(ctx context.Context, name string, opts v1.DeleteOptions) error {
	return c.client.Delete().
		Namespace(c.ns).
		Resource("ingressconfigs").
		Name(name).
		Body(&opts).
		Do(ctx).
		Error()
}

// DeleteCollection deletes a collection of objects.
func (c *ingressConfigs) DeleteCollection(ctx context.Context, opts v1.DeleteOptions, listOpts v1.ListOptions) error {
	var timeout time.Duration
	if listOpts.TimeoutSeconds != nil {
		timeout = time.Duration(*listOpts.TimeoutSeconds) * time.Second
	}
	return c.client.Delete().
		Namespace(c.ns).
		Resource("ingressconfigs").
		VersionedParams(&listOpts, scheme.ParameterCodec).
		Timeout(timeout).
		Body(&opts).
		Do(ctx).
		Error()
}

// Patch applies the patch and returns the patched ingressConfig.
func (c *ingressConfigs) Patch(ctx context.Context, name string, pt types.PatchType, data []byte, opts v1.PatchOptions, subresources ...string) (result *v1beta1.IngressConfig, err error) {
	result = &v1beta1.IngressConfig{}
	err = c.client.Patch(pt).
		Namespace(c.ns).
		Resource("ingressconfigs").
		Name(name).
		SubResource(subresources...).
		VersionedParams(&opts, scheme.ParameterCodec).
		Body(data).
		Do(ctx).
		Into(result)
	return
}
